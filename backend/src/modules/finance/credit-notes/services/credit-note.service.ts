import { Inject, Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { LedgerPostingService } from '../../ledger/services/ledger-posting.service';
import { CreditNoteDomainService } from '../domain/credit-note-domain.service';
import {
  CREDIT_NOTE_DOMAIN_ERROR_CODES,
  CreditNoteDomainError,
} from '../domain/credit-note-domain.errors';
import {
  CREDIT_NOTE_APPLICATION_REPOSITORY,
  CREDIT_NOTE_REPOSITORY,
  type CreditNoteApplicationRepository,
  type CreditNoteRepository,
  type CreditNoteTransactionClient,
  type CreateCreditNoteData,
} from '../repositories/credit-note.repository.interface';
import type {
  ApplyCreditNoteCommand,
  CreateCreditNoteCommand,
  CreditNoteApplicationContext,
  CreditNoteApplicationRecord,
  CreditNoteRecord,
  CreditNoteScope,
  ListCreditNotesQuery,
  ListCreditNotesResult,
} from './credit-note-application.types';

@Injectable()
export class CreditNoteService {
  constructor(
    @Inject(CREDIT_NOTE_REPOSITORY)
    private readonly creditNoteRepository: CreditNoteRepository,
    @Inject(CREDIT_NOTE_APPLICATION_REPOSITORY)
    private readonly applicationRepository: CreditNoteApplicationRepository,
    private readonly domainService: CreditNoteDomainService,
    private readonly activityService: ActivityService,
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly prisma: PrismaService,
  ) {}

  async createCreditNote(
    scope: CreditNoteScope,
    command: CreateCreditNoteCommand,
    context: CreditNoteApplicationContext,
  ): Promise<CreditNoteRecord> {
    this.domainService.validateCreate({
      clientId: command.clientId,
      creditNoteNumber: command.creditNoteNumber,
      amount: command.amount,
      taxAmount: command.taxAmount,
      currency: command.currency,
      status: command.status,
    });

    const now = new Date();
    const data: CreateCreditNoteData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId: command.clientId,
      invoiceId: command.invoiceId ?? null,
      creditNoteNumber: this.domainService.normalizeRequiredString(command.creditNoteNumber),
      issueDate: command.issueDate,
      amount: command.amount,
      taxAmount: command.taxAmount ?? null,
      currency: this.domainService.normalizeCurrency(command.currency),
      status: command.status ?? 'DRAFT',
      appliedAmount: 0,
      notes: this.domainService.normalizeOptionalString(command.notes),
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const created = await this.creditNoteRepository.create(data, tx);
      await this.activityService.createActivity(
        scope,
        {
          entityType: 'credit_note',
          entityId: created.id,
          type: ActivityType.CUSTOM,
          title: 'Credit Note Created',
          description: 'Credit note was created.',
          metadata: { amount: created.amount, creditNoteNumber: created.creditNoteNumber },
        },
        { actorUserId: context.actorUserId },
      );
      await this.ledgerPostingService.postCreditNote(
        scope,
        {
          entryDate: created.issueDate,
          entityType: 'credit_note',
          entityId: created.id,
          clientId: created.clientId,
          amount: created.amount,
          description: `Credit note ${created.creditNoteNumber}`,
          referenceType: 'credit_note',
          referenceId: created.id,
        },
        { actorUserId: context.actorUserId },
      );
      return created;
    });
  }

  async applyCreditNote(
    scope: CreditNoteScope,
    creditNoteId: string,
    command: ApplyCreditNoteCommand,
    context: CreditNoteApplicationContext,
  ): Promise<{ note: CreditNoteRecord; application: CreditNoteApplicationRecord }> {
    const note = await this.requireNote(scope, creditNoteId);
    const remaining = Math.max(0, note.amount - note.appliedAmount);
    this.domainService.validateApply(note, { amount: command.amount, remaining });

    const now = new Date();
    const newApplied = note.appliedAmount + command.amount;
    const status = newApplied + 0.001 >= note.amount ? 'APPLIED' : 'ISSUED';

    return this.runInTransaction(async (tx) => {
      const application = await this.applicationRepository.create(
        {
          id: randomUUID(),
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          creditNoteId,
          invoiceId: command.invoiceId,
          amount: command.amount,
          appliedAt: now,
          createdAt: now,
          createdByUserId: context.actorUserId,
        },
        tx,
      );

      const updated = await this.creditNoteRepository.update(
        scope,
        creditNoteId,
        {
          status,
          appliedAmount: newApplied,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );

      if (updated === null) {
        throw new CreditNoteDomainError(
          CREDIT_NOTE_DOMAIN_ERROR_CODES.CREDIT_NOTE_NOT_FOUND,
          'Credit note was not found.',
        );
      }

      return { note: updated, application };
    });
  }

  async voidCreditNote(
    scope: CreditNoteScope,
    creditNoteId: string,
    context: CreditNoteApplicationContext,
  ): Promise<CreditNoteRecord> {
    const note = await this.requireNote(scope, creditNoteId);
    this.domainService.validateVoid(note);
    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const updated = await this.creditNoteRepository.update(
        scope,
        creditNoteId,
        {
          status: 'VOID',
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );
      if (updated === null) {
        throw new CreditNoteDomainError(
          CREDIT_NOTE_DOMAIN_ERROR_CODES.CREDIT_NOTE_NOT_FOUND,
          'Credit note was not found.',
        );
      }
      return updated;
    });
  }

  async getCreditNote(scope: CreditNoteScope, id: string): Promise<CreditNoteRecord> {
    const note = await this.requireNote(scope, id);
    this.domainService.ensureWorkspaceOwnership(scope, note);
    return note;
  }

  async listCreditNotes(
    scope: CreditNoteScope,
    query: ListCreditNotesQuery = {},
  ): Promise<ListCreditNotesResult> {
    return this.creditNoteRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      clientId: query.clientId,
      invoiceId: query.invoiceId,
      status: query.status,
      includeArchived: query.includeArchived,
    });
  }

  private async runInTransaction<T>(
    work: (tx: CreditNoteTransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => work(tx));
  }

  private async requireNote(scope: CreditNoteScope, id: string): Promise<CreditNoteRecord> {
    const note = await this.creditNoteRepository.findById(scope, id);
    if (note === null) {
      throw new CreditNoteDomainError(
        CREDIT_NOTE_DOMAIN_ERROR_CODES.CREDIT_NOTE_NOT_FOUND,
        'Credit note was not found.',
      );
    }
    return note;
  }
}
