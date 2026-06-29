import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ClientScope } from '../../../clients/repositories/client.repository.interface';
import { InvoiceDomainService } from '../domain/invoice-domain.service';
import { INVOICE_DOMAIN_ERROR_CODES, InvoiceDomainError } from '../domain/invoice-domain.errors';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  INVOICE_REPOSITORY,
  type CreateInvoiceData,
  type InvoiceRepository,
  type InvoiceScope,
  type UpdateInvoiceData,
} from '../repositories/invoice.repository.interface';
import type {
  CreateInvoiceCommand,
  InvoiceApplicationContext,
  InvoiceRecord,
  ListInvoicesQuery,
  ListInvoicesResult,
  UpdateInvoiceCommand,
} from './invoice-application.types';

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceDomainService: InvoiceDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async createInvoice(
    scope: InvoiceScope,
    command: CreateInvoiceCommand,
    context: InvoiceApplicationContext,
  ): Promise<InvoiceRecord> {
    const clientScope = toClientScope(scope);
    const invoiceNumber =
      command.invoiceNumber !== undefined && command.invoiceNumber.trim().length > 0
        ? this.invoiceDomainService.normalizeInvoiceNumber(command.invoiceNumber)
        : this.invoiceDomainService.generateInvoiceNumber();

    this.invoiceDomainService.validateCreate({
      invoiceNumber,
      issueDate: command.issueDate,
      dueDate: command.dueDate,
      status: command.status,
    });

    await this.invoiceDomainService.validateClient(clientScope, command.clientId);
    await this.invoiceDomainService.validateProject(scope, command.projectId, command.clientId);

    if (command.quoteId !== undefined && command.quoteId !== null) {
      await this.invoiceDomainService.validateQuote(scope, command.quoteId, command.clientId);
    }

    await this.assertInvoiceNumberUnique(scope, invoiceNumber);

    const now = new Date();

    const data: CreateInvoiceData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId: command.clientId,
      projectId: command.projectId,
      quoteId: command.quoteId ?? null,
      invoiceNumber,
      status: command.status ?? 'DRAFT',
      issueDate: command.issueDate,
      dueDate: command.dueDate,
      currency: command.currency ?? 'USD',
      notes: this.invoiceDomainService.normalizeOptionalNotes(command.notes),
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(() => this.invoiceRepository.create(data));
  }

  async updateInvoice(
    scope: InvoiceScope,
    invoiceId: string,
    command: UpdateInvoiceCommand,
    context: InvoiceApplicationContext,
  ): Promise<InvoiceRecord> {
    const existing = await this.requireInvoice(scope, invoiceId, { includeArchived: true });
    const clientScope = toClientScope(scope);
    const nextClientId = command.clientId ?? existing.clientId;
    const nextProjectId = command.projectId ?? existing.projectId;
    const nextQuoteId = command.quoteId !== undefined ? command.quoteId : existing.quoteId;
    const nextInvoiceNumber =
      command.invoiceNumber !== undefined
        ? this.invoiceDomainService.normalizeInvoiceNumber(command.invoiceNumber)
        : undefined;

    this.invoiceDomainService.validateUpdate(existing, {
      invoiceNumber: nextInvoiceNumber,
      issueDate: command.issueDate,
      dueDate: command.dueDate,
      status: command.status,
    });

    if (command.clientId !== undefined) {
      await this.invoiceDomainService.validateClient(clientScope, command.clientId);
    }

    if (command.projectId !== undefined || command.clientId !== undefined) {
      await this.invoiceDomainService.validateProject(scope, nextProjectId, nextClientId);
    }

    if (nextQuoteId !== null) {
      await this.invoiceDomainService.validateQuote(scope, nextQuoteId, nextClientId);
    }

    if (nextInvoiceNumber !== undefined && nextInvoiceNumber !== existing.invoiceNumber) {
      await this.assertInvoiceNumberUnique(scope, nextInvoiceNumber, invoiceId);
    }

    const now = new Date();

    const data: UpdateInvoiceData = {
      ...(command.clientId !== undefined ? { clientId: command.clientId } : {}),
      ...(command.projectId !== undefined ? { projectId: command.projectId } : {}),
      ...(command.quoteId !== undefined ? { quoteId: command.quoteId } : {}),
      ...(nextInvoiceNumber !== undefined ? { invoiceNumber: nextInvoiceNumber } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.issueDate !== undefined ? { issueDate: command.issueDate } : {}),
      ...(command.dueDate !== undefined ? { dueDate: command.dueDate } : {}),
      ...(command.currency !== undefined ? { currency: command.currency } : {}),
      ...(command.notes !== undefined
        ? { notes: this.invoiceDomainService.normalizeOptionalNotes(command.notes) }
        : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.invoiceRepository.update(scope, invoiceId, data);

      if (updated === null) {
        throw new InvoiceDomainError(
          INVOICE_DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND,
          'Invoice was not found.',
        );
      }

      return updated;
    });
  }

  async getInvoice(scope: InvoiceScope, invoiceId: string): Promise<InvoiceRecord> {
    return this.requireInvoice(scope, invoiceId);
  }

  async listInvoices(
    scope: InvoiceScope,
    query: ListInvoicesQuery = {},
  ): Promise<ListInvoicesResult> {
    return this.invoiceRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      status: query.status,
      clientId: query.clientId,
      projectId: query.projectId,
      quoteId: query.quoteId,
      includeArchived: query.includeArchived,
    });
  }

  private async assertInvoiceNumberUnique(
    scope: InvoiceScope,
    invoiceNumber: string,
    excludeInvoiceId?: string,
  ): Promise<void> {
    const existing = await this.invoiceRepository.findByInvoiceNumber(scope, invoiceNumber);

    if (existing !== null && existing.id !== excludeInvoiceId) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVOICE_NUMBER_NOT_UNIQUE,
        'Invoice number is already in use.',
      );
    }
  }

  private async requireInvoice(
    scope: InvoiceScope,
    invoiceId: string,
    options?: { includeArchived?: boolean },
  ): Promise<InvoiceRecord> {
    const invoice = await this.invoiceRepository.findById(scope, invoiceId, options);

    if (invoice === null) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND,
        'Invoice was not found.',
      );
    }

    return invoice;
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}

function toClientScope(scope: InvoiceScope): ClientScope {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
  };
}
