import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { calculateLineItemTotal, calculateQuotePricingSummary } from '../../pricing/pricing-engine';
import {
  QUOTE_DOMAIN_ERROR_CODES,
  QuoteDomainError,
} from '../../quotes/domain/quote-domain.errors';
import {
  QUOTE_REPOSITORY,
  type QuoteRepository,
  type QuoteScope,
} from '../../quotes/repositories/quote.repository.interface';
import { QuoteLineItemDomainService } from '../domain/quote-line-item-domain.service';
import {
  QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES,
  QuoteLineItemDomainError,
} from '../domain/quote-line-item-domain.errors';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  QUOTE_LINE_ITEM_REPOSITORY,
  type CreateQuoteLineItemData,
  type QuoteLineItemQuoteScope,
  type QuoteLineItemRecord,
  type QuoteLineItemRepository,
  type QuoteLineItemScope,
  type UpdateQuoteLineItemData,
} from '../repositories/quote-line-item.repository.interface';
import type {
  CreateQuoteLineItemCommand,
  QuoteLineItemApplicationContext,
  UpdateQuoteLineItemCommand,
} from './quote-line-item-application.types';

@Injectable()
export class QuoteLineItemService {
  constructor(
    @Inject(QUOTE_LINE_ITEM_REPOSITORY)
    private readonly quoteLineItemRepository: QuoteLineItemRepository,
    @Inject(QUOTE_REPOSITORY)
    private readonly quoteRepository: QuoteRepository,
    private readonly quoteLineItemDomainService: QuoteLineItemDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async listLineItems(scope: QuoteScope, quoteId: string): Promise<readonly QuoteLineItemRecord[]> {
    await this.requireQuoteForRead(scope, quoteId);

    return this.quoteLineItemRepository.listByQuote(this.toQuoteScope(scope, quoteId));
  }

  async createLineItem(
    scope: QuoteScope,
    quoteId: string,
    command: CreateQuoteLineItemCommand,
    context: QuoteLineItemApplicationContext,
  ): Promise<QuoteLineItemRecord> {
    await this.requireQuoteForMutation(scope, quoteId);

    this.quoteLineItemDomainService.validateCreate({
      name: command.name,
      quantity: command.quantity,
      unitPrice: command.unitPrice,
      discount: command.discount,
      tax: command.tax,
      sortOrder: command.sortOrder,
    });

    const discount = command.discount ?? 0;
    const tax = command.tax ?? 0;
    const total = calculateLineItemTotal({
      quantity: command.quantity,
      unitPrice: command.unitPrice,
      discount,
      tax,
    });

    const quoteScope = this.toQuoteScope(scope, quoteId);
    const sortOrder =
      command.sortOrder ?? (await this.quoteLineItemRepository.getMaxSortOrder(quoteScope)) + 1;

    const now = new Date();

    const data: CreateQuoteLineItemData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      quoteId,
      name: this.quoteLineItemDomainService.normalizeName(command.name),
      description: this.quoteLineItemDomainService.normalizeOptionalDescription(
        command.description,
      ),
      quantity: command.quantity,
      unit: this.quoteLineItemDomainService.normalizeOptionalUnit(command.unit),
      unitPrice: command.unitPrice,
      discount,
      tax,
      total,
      sortOrder,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const lineItem = await this.quoteLineItemRepository.create(data);
      await this.syncQuoteTotal(scope, quoteId, context, now);
      return lineItem;
    });
  }

  async updateLineItem(
    scope: QuoteLineItemScope,
    lineItemId: string,
    command: UpdateQuoteLineItemCommand,
    context: QuoteLineItemApplicationContext,
  ): Promise<QuoteLineItemRecord> {
    const existing = await this.requireLineItem(scope, lineItemId);
    await this.requireQuoteForMutation(scope, existing.quoteId);

    this.quoteLineItemDomainService.validateUpdate(existing, {
      name: command.name,
      quantity: command.quantity,
      unitPrice: command.unitPrice,
      discount: command.discount,
      tax: command.tax,
      sortOrder: command.sortOrder,
    });

    const quantity = command.quantity ?? existing.quantity;
    const unitPrice = command.unitPrice ?? existing.unitPrice;
    const discount = command.discount ?? existing.discount;
    const tax = command.tax ?? existing.tax;
    const total = calculateLineItemTotal({ quantity, unitPrice, discount, tax });

    const now = new Date();

    const data: UpdateQuoteLineItemData = {
      ...(command.name !== undefined
        ? { name: this.quoteLineItemDomainService.normalizeName(command.name) }
        : {}),
      ...(command.description !== undefined
        ? {
            description: this.quoteLineItemDomainService.normalizeOptionalDescription(
              command.description,
            ),
          }
        : {}),
      ...(command.quantity !== undefined ? { quantity: command.quantity } : {}),
      ...(command.unit !== undefined
        ? { unit: this.quoteLineItemDomainService.normalizeOptionalUnit(command.unit) }
        : {}),
      ...(command.unitPrice !== undefined ? { unitPrice: command.unitPrice } : {}),
      ...(command.discount !== undefined ? { discount: command.discount } : {}),
      ...(command.tax !== undefined ? { tax: command.tax } : {}),
      ...(command.sortOrder !== undefined ? { sortOrder: command.sortOrder } : {}),
      total,
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.quoteLineItemRepository.update(scope, lineItemId, data);

      if (updated === null) {
        throw new QuoteLineItemDomainError(
          QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
          'Line item was not found.',
        );
      }

      await this.syncQuoteTotal(scope, existing.quoteId, context, now);
      return updated;
    });
  }

  async deleteLineItem(
    scope: QuoteLineItemScope,
    lineItemId: string,
    context: QuoteLineItemApplicationContext,
  ): Promise<QuoteLineItemRecord> {
    const existing = await this.requireLineItem(scope, lineItemId);
    await this.requireQuoteForMutation(scope, existing.quoteId);
    const now = new Date();

    return this.runInTransaction(async () => {
      const deleted = await this.quoteLineItemRepository.softDelete(scope, lineItemId, {
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (deleted === null) {
        throw new QuoteLineItemDomainError(
          QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
          'Line item was not found.',
        );
      }

      await this.syncQuoteTotal(scope, existing.quoteId, context, now);
      return deleted;
    });
  }

  private async syncQuoteTotal(
    scope: QuoteScope,
    quoteId: string,
    context: QuoteLineItemApplicationContext,
    updatedAt: Date,
  ): Promise<void> {
    const lineItems = await this.quoteLineItemRepository.listByQuote(
      this.toQuoteScope(scope, quoteId),
    );
    const summary = calculateQuotePricingSummary(lineItems);

    await this.quoteRepository.update(scope, quoteId, {
      totalAmount: summary.grandTotal,
      updatedAt,
      updatedByUserId: context.actorUserId,
    });
  }

  private async requireQuoteForRead(scope: QuoteScope, quoteId: string): Promise<void> {
    const quote = await this.quoteRepository.findById(scope, quoteId);

    if (quote === null) {
      throw new QuoteDomainError(QUOTE_DOMAIN_ERROR_CODES.QUOTE_NOT_FOUND, 'Quote was not found.');
    }
  }

  private async requireQuoteForMutation(scope: QuoteScope, quoteId: string) {
    const quote = await this.quoteRepository.findById(scope, quoteId);

    if (quote === null) {
      throw new QuoteDomainError(QUOTE_DOMAIN_ERROR_CODES.QUOTE_NOT_FOUND, 'Quote was not found.');
    }

    this.quoteLineItemDomainService.assertQuoteIsActive(quote);
    return quote;
  }

  private async requireLineItem(
    scope: QuoteLineItemScope,
    lineItemId: string,
  ): Promise<QuoteLineItemRecord> {
    const lineItem = await this.quoteLineItemRepository.findById(scope, lineItemId);

    if (lineItem === null) {
      throw new QuoteLineItemDomainError(
        QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
        'Line item was not found.',
      );
    }

    return lineItem;
  }

  private toQuoteScope(scope: QuoteScope, quoteId: string): QuoteLineItemQuoteScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      quoteId,
    };
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}
