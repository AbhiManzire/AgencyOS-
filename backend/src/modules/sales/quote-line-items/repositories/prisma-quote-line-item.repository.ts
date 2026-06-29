import { Injectable } from '@nestjs/common';
import { Prisma, type QuoteLineItem } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateQuoteLineItemData,
  QuoteLineItemQuoteScope,
  QuoteLineItemRecord,
  QuoteLineItemRepository,
  QuoteLineItemScope,
  SoftDeleteQuoteLineItemData,
  UpdateQuoteLineItemData,
} from './quote-line-item.repository.interface';

@Injectable()
export class PrismaQuoteLineItemRepository implements QuoteLineItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateQuoteLineItemData): Promise<QuoteLineItemRecord> {
    const lineItem = await this.prisma.quoteLineItem.create({
      data: {
        ...data,
        quantity: new Prisma.Decimal(data.quantity),
        unitPrice: new Prisma.Decimal(data.unitPrice),
        discount: new Prisma.Decimal(data.discount ?? 0),
        tax: new Prisma.Decimal(data.tax ?? 0),
        total: new Prisma.Decimal(data.total),
      },
    });

    return toQuoteLineItemRecord(lineItem);
  }

  async update(
    scope: QuoteLineItemScope,
    id: string,
    data: UpdateQuoteLineItemData,
  ): Promise<QuoteLineItemRecord | null> {
    const { quantity, unitPrice, discount, tax, total, ...rest } = data;

    const result = await this.prisma.quoteLineItem.updateMany({
      where: activeLineItemWhere(scope, id),
      data: {
        ...rest,
        ...(quantity !== undefined ? { quantity: new Prisma.Decimal(quantity) } : {}),
        ...(unitPrice !== undefined ? { unitPrice: new Prisma.Decimal(unitPrice) } : {}),
        ...(discount !== undefined ? { discount: new Prisma.Decimal(discount) } : {}),
        ...(tax !== undefined ? { tax: new Prisma.Decimal(tax) } : {}),
        ...(total !== undefined ? { total: new Prisma.Decimal(total) } : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async softDelete(
    scope: QuoteLineItemScope,
    id: string,
    data: SoftDeleteQuoteLineItemData,
  ): Promise<QuoteLineItemRecord | null> {
    const result = await this.prisma.quoteLineItem.updateMany({
      where: activeLineItemWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const lineItem = await this.prisma.quoteLineItem.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
    });

    return lineItem ? toQuoteLineItemRecord(lineItem) : null;
  }

  async findById(scope: QuoteLineItemScope, id: string): Promise<QuoteLineItemRecord | null> {
    const lineItem = await this.prisma.quoteLineItem.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    return lineItem ? toQuoteLineItemRecord(lineItem) : null;
  }

  async listByQuote(scope: QuoteLineItemQuoteScope): Promise<readonly QuoteLineItemRecord[]> {
    const lineItems = await this.prisma.quoteLineItem.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        quoteId: scope.quoteId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return lineItems.map(toQuoteLineItemRecord);
  }

  async getMaxSortOrder(scope: QuoteLineItemQuoteScope): Promise<number> {
    const result = await this.prisma.quoteLineItem.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        quoteId: scope.quoteId,
        deletedAt: null,
      },
      _max: { sortOrder: true },
    });

    return result._max.sortOrder ?? -1;
  }
}

function activeLineItemWhere(scope: QuoteLineItemScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function toQuoteLineItemRecord(lineItem: QuoteLineItem): QuoteLineItemRecord {
  return {
    id: lineItem.id,
    tenantId: lineItem.tenantId,
    workspaceId: lineItem.workspaceId,
    quoteId: lineItem.quoteId,
    name: lineItem.name,
    description: lineItem.description,
    quantity: lineItem.quantity.toNumber(),
    unit: lineItem.unit,
    unitPrice: lineItem.unitPrice.toNumber(),
    discount: lineItem.discount.toNumber(),
    tax: lineItem.tax.toNumber(),
    total: lineItem.total.toNumber(),
    sortOrder: lineItem.sortOrder,
    createdAt: lineItem.createdAt,
    updatedAt: lineItem.updatedAt,
    createdByUserId: lineItem.createdByUserId,
    updatedByUserId: lineItem.updatedByUserId,
    deletedAt: lineItem.deletedAt,
    deletedByUserId: lineItem.deletedByUserId,
  };
}
