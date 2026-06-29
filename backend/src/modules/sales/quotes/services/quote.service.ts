import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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
  UpdateQuoteCommand,
} from './quote-application.types';

@Injectable()
export class QuoteService {
  constructor(
    @Inject(QUOTE_REPOSITORY)
    private readonly quoteRepository: QuoteRepository,
    private readonly quoteDomainService: QuoteDomainService,
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

    return this.runInTransaction(() => this.quoteRepository.create(data));
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

    return this.runInTransaction(async () => {
      const updated = await this.quoteRepository.update(scope, quoteId, data);

      if (updated === null) {
        throw new QuoteDomainError(
          QUOTE_DOMAIN_ERROR_CODES.QUOTE_NOT_FOUND,
          'Quote was not found.',
        );
      }

      return updated;
    });
  }

  async getQuote(scope: QuoteScope, quoteId: string): Promise<QuoteRecord> {
    return this.requireQuote(scope, quoteId);
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
