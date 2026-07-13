import { Inject, Injectable } from '@nestjs/common';
import { ActivityType, type Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import type { ClientScope } from '../../../clients/repositories/client.repository.interface';
import { QuoteDomainService } from '../domain/quote-domain.service';
import { QUOTE_DOMAIN_ERROR_CODES, QuoteDomainError } from '../domain/quote-domain.errors';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  QUOTE_REPOSITORY,
  type CreateQuoteData,
  type QuoteRepository,
  type QuoteScope,
  type UpdateQuoteData,
} from '../repositories/quote.repository.interface';
import type {
  CreateQuoteCommand,
  ListQuotesQuery,
  ListQuotesResult,
  QuoteApplicationContext,
  QuoteRecord,
  QuoteRevisionRecord,
  UpdateQuoteCommand,
} from './quote-application.types';

@Injectable()
export class QuoteService {
  constructor(
    @Inject(QUOTE_REPOSITORY)
    private readonly quoteRepository: QuoteRepository,
    private readonly quoteDomainService: QuoteDomainService,
    private readonly activityService: ActivityService,
    private readonly prisma: PrismaService,
  ) {}

  async createQuote(
    scope: QuoteScope,
    command: CreateQuoteCommand,
    context: QuoteApplicationContext,
  ): Promise<QuoteRecord> {
    const clientScope = toClientScope(scope);
    const quoteNumber =
      command.quoteNumber !== undefined && command.quoteNumber.trim().length > 0
        ? this.quoteDomainService.normalizeQuoteNumber(command.quoteNumber)
        : this.quoteDomainService.generateQuoteNumber();

    this.quoteDomainService.validateCreate({
      title: command.title,
      quoteNumber,
      totalAmount: command.totalAmount,
      status: command.status,
    });

    await this.quoteDomainService.validateClient(clientScope, command.clientId);
    await this.quoteDomainService.validateDeal(scope, command.dealId, command.clientId);
    await this.assertQuoteNumberUnique(scope, quoteNumber);

    const now = new Date();

    const data: CreateQuoteData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      dealId: command.dealId,
      clientId: command.clientId,
      quoteNumber,
      title: this.quoteDomainService.normalizeTitle(command.title),
      status: command.status ?? 'DRAFT',
      validUntil: command.validUntil ?? null,
      currency: command.currency ?? 'USD',
      totalAmount: command.totalAmount,
      notes: this.quoteDomainService.normalizeOptionalNotes(command.notes),
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const created = await this.quoteRepository.create(data);

      await this.emitActivity(
        scope,
        created.dealId,
        ActivityType.CUSTOM,
        'Quote Created',
        context,
        { quoteId: created.id, quoteNumber: created.quoteNumber },
        `Quote ${created.quoteNumber} was created.`,
      );

      return created;
    });
  }

  async updateQuote(
    scope: QuoteScope,
    quoteId: string,
    command: UpdateQuoteCommand,
    context: QuoteApplicationContext,
  ): Promise<QuoteRecord> {
    const existing = await this.requireQuote(scope, quoteId, { includeArchived: true });
    const clientScope = toClientScope(scope);
    const nextClientId = command.clientId ?? existing.clientId;
    const nextDealId = command.dealId ?? existing.dealId;
    const nextQuoteNumber =
      command.quoteNumber !== undefined
        ? this.quoteDomainService.normalizeQuoteNumber(command.quoteNumber)
        : undefined;

    this.quoteDomainService.validateUpdate(existing, {
      title: command.title,
      quoteNumber: nextQuoteNumber,
      totalAmount: command.totalAmount,
      status: command.status,
    });

    if (command.clientId !== undefined) {
      await this.quoteDomainService.validateClient(clientScope, command.clientId);
    }

    if (command.dealId !== undefined || command.clientId !== undefined) {
      await this.quoteDomainService.validateDeal(scope, nextDealId, nextClientId);
    }

    if (nextQuoteNumber !== undefined && nextQuoteNumber !== existing.quoteNumber) {
      await this.assertQuoteNumberUnique(scope, nextQuoteNumber, quoteId);
    }

    const now = new Date();

    const data: UpdateQuoteData = {
      ...(command.dealId !== undefined ? { dealId: command.dealId } : {}),
      ...(command.clientId !== undefined ? { clientId: command.clientId } : {}),
      ...(nextQuoteNumber !== undefined ? { quoteNumber: nextQuoteNumber } : {}),
      ...(command.title !== undefined
        ? { title: this.quoteDomainService.normalizeTitle(command.title) }
        : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.validUntil !== undefined ? { validUntil: command.validUntil } : {}),
      ...(command.currency !== undefined ? { currency: command.currency } : {}),
      ...(command.totalAmount !== undefined ? { totalAmount: command.totalAmount } : {}),
      ...(command.notes !== undefined
        ? { notes: this.quoteDomainService.normalizeOptionalNotes(command.notes) }
        : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    const totalAmountChanged =
      command.totalAmount !== undefined && command.totalAmount !== existing.totalAmount;
    const statusChanged = command.status !== undefined && command.status !== existing.status;

    return this.runInTransaction(async () => {
      if (totalAmountChanged || statusChanged) {
        await this.createRevisionSnapshot(scope, existing, context);
      }

      const updated = await this.quoteRepository.update(scope, quoteId, data);

      if (updated === null) {
        throw new QuoteDomainError(
          QUOTE_DOMAIN_ERROR_CODES.QUOTE_NOT_FOUND,
          'Quote was not found.',
        );
      }

      await this.emitActivity(
        scope,
        updated.dealId,
        ActivityType.CUSTOM,
        'Quote Updated',
        context,
        { quoteId: updated.id, quoteNumber: updated.quoteNumber },
        `Quote ${updated.quoteNumber} was updated.`,
      );

      if (statusChanged && updated.status === 'SENT') {
        await this.emitActivity(
          scope,
          updated.dealId,
          ActivityType.QUOTE_SENT,
          'Quote Sent',
          context,
          { quoteId: updated.id, quoteNumber: updated.quoteNumber },
          `Quote ${updated.quoteNumber} was sent.`,
        );

        await this.emitActivity(
          scope,
          updated.dealId,
          ActivityType.CUSTOM,
          'Quote Generated',
          context,
          { quoteId: updated.id, quoteNumber: updated.quoteNumber },
          `Quote ${updated.quoteNumber} was generated.`,
        );
      }

      return updated;
    });
  }

  async getQuote(scope: QuoteScope, quoteId: string): Promise<QuoteRecord> {
    return this.requireQuote(scope, quoteId);
  }

  async listQuoteRevisions(
    scope: QuoteScope,
    quoteId: string,
  ): Promise<readonly QuoteRevisionRecord[]> {
    await this.requireQuote(scope, quoteId, { includeArchived: true });

    const revisions = await this.prisma.quoteRevision.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        quoteId,
      },
      orderBy: { revision: 'desc' },
    });

    return revisions.map((revision) => ({
      id: revision.id,
      quoteId: revision.quoteId,
      revision: revision.revision,
      title: revision.title,
      status: revision.status,
      totalAmount: revision.totalAmount.toNumber(),
      currency: revision.currency,
      validUntil: revision.validUntil,
      lineItemsJson: revision.lineItemsJson,
      createdAt: revision.createdAt,
      createdByUserId: revision.createdByUserId,
    }));
  }

  async listQuotes(scope: QuoteScope, query: ListQuotesQuery = {}): Promise<ListQuotesResult> {
    return this.quoteRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      status: query.status,
      dealId: query.dealId,
      clientId: query.clientId,
      includeArchived: query.includeArchived,
    });
  }

  private async assertQuoteNumberUnique(
    scope: QuoteScope,
    quoteNumber: string,
    excludeQuoteId?: string,
  ): Promise<void> {
    const existing = await this.quoteRepository.findByQuoteNumber(scope, quoteNumber);

    if (existing !== null && existing.id !== excludeQuoteId) {
      throw new QuoteDomainError(
        QUOTE_DOMAIN_ERROR_CODES.QUOTE_NUMBER_NOT_UNIQUE,
        'Quote number is already in use.',
      );
    }
  }

  private async requireQuote(
    scope: QuoteScope,
    quoteId: string,
    options?: { includeArchived?: boolean },
  ): Promise<QuoteRecord> {
    const quote = await this.quoteRepository.findById(scope, quoteId, options);

    if (quote === null) {
      throw new QuoteDomainError(QUOTE_DOMAIN_ERROR_CODES.QUOTE_NOT_FOUND, 'Quote was not found.');
    }

    return quote;
  }

  private async createRevisionSnapshot(
    scope: QuoteScope,
    quote: QuoteRecord,
    context: QuoteApplicationContext,
  ): Promise<void> {
    const lineItems = await this.prisma.quoteLineItem.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        quoteId: quote.id,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const lastRevision = await this.prisma.quoteRevision.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        quoteId: quote.id,
      },
      orderBy: { revision: 'desc' },
    });

    const nextRevision = (lastRevision?.revision ?? 0) + 1;

    await this.prisma.quoteRevision.create({
      data: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        quoteId: quote.id,
        revision: nextRevision,
        title: quote.title,
        status: quote.status,
        totalAmount: quote.totalAmount,
        currency: quote.currency,
        validUntil: quote.validUntil,
        lineItemsJson: lineItems.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity.toNumber(),
          unit: item.unit,
          unitPrice: item.unitPrice.toNumber(),
          discount: item.discount.toNumber(),
          tax: item.tax.toNumber(),
          total: item.total.toNumber(),
          sortOrder: item.sortOrder,
        })),
        createdAt: new Date(),
        createdByUserId: context.actorUserId,
      },
    });
  }

  private async emitActivity(
    scope: QuoteScope,
    dealId: string,
    type: ActivityType,
    title: string,
    context: QuoteApplicationContext,
    metadata: Prisma.InputJsonValue,
    description: string,
  ): Promise<void> {
    await this.activityService.createActivity(
      scope,
      {
        entityType: 'deal',
        entityId: dealId,
        type,
        title,
        description,
        metadata,
      },
      { actorUserId: context.actorUserId },
    );
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}

function toClientScope(scope: QuoteScope): ClientScope {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
  };
}
