import { Injectable } from '@nestjs/common';
import { Prisma, type DealLineItem } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateDealLineItemData,
  DealLineItemDealScope,
  DealLineItemRecord,
  DealLineItemRepository,
  DealLineItemScope,
  SoftDeleteDealLineItemData,
  UpdateDealLineItemData,
} from './deal-line-item.repository.interface';

@Injectable()
export class PrismaDealLineItemRepository implements DealLineItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDealLineItemData): Promise<DealLineItemRecord> {
    const lineItem = await this.prisma.dealLineItem.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        dealId: data.dealId,
        name: data.name,
        description: data.description ?? null,
        quantity: new Prisma.Decimal(data.quantity),
        unitPrice: new Prisma.Decimal(data.unitPrice),
        discount: new Prisma.Decimal(data.discount ?? 0),
        tax: new Prisma.Decimal(data.tax ?? 0),
        subtotal: new Prisma.Decimal(data.subtotal),
        total: new Prisma.Decimal(data.total),
        sortOrder: data.sortOrder,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });

    return toDealLineItemRecord(lineItem);
  }

  async update(
    scope: DealLineItemScope,
    id: string,
    data: UpdateDealLineItemData,
  ): Promise<DealLineItemRecord | null> {
    const { quantity, unitPrice, discount, tax, subtotal, total, ...rest } = data;

    const result = await this.prisma.dealLineItem.updateMany({
      where: activeLineItemWhere(scope, id),
      data: {
        ...rest,
        ...(quantity !== undefined ? { quantity: new Prisma.Decimal(quantity) } : {}),
        ...(unitPrice !== undefined ? { unitPrice: new Prisma.Decimal(unitPrice) } : {}),
        ...(discount !== undefined ? { discount: new Prisma.Decimal(discount) } : {}),
        ...(tax !== undefined ? { tax: new Prisma.Decimal(tax) } : {}),
        ...(subtotal !== undefined ? { subtotal: new Prisma.Decimal(subtotal) } : {}),
        ...(total !== undefined ? { total: new Prisma.Decimal(total) } : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async softDelete(
    scope: DealLineItemScope,
    id: string,
    data: SoftDeleteDealLineItemData,
  ): Promise<DealLineItemRecord | null> {
    const result = await this.prisma.dealLineItem.updateMany({
      where: activeLineItemWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const lineItem = await this.prisma.dealLineItem.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
    });

    return lineItem ? toDealLineItemRecord(lineItem) : null;
  }

  async findById(scope: DealLineItemScope, id: string): Promise<DealLineItemRecord | null> {
    const lineItem = await this.prisma.dealLineItem.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    return lineItem ? toDealLineItemRecord(lineItem) : null;
  }

  async listByDeal(scope: DealLineItemDealScope): Promise<readonly DealLineItemRecord[]> {
    const lineItems = await this.prisma.dealLineItem.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        dealId: scope.dealId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return lineItems.map(toDealLineItemRecord);
  }

  async getMaxSortOrder(scope: DealLineItemDealScope): Promise<number> {
    const result = await this.prisma.dealLineItem.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        dealId: scope.dealId,
        deletedAt: null,
      },
      _max: { sortOrder: true },
    });

    return result._max.sortOrder ?? -1;
  }
}

function activeLineItemWhere(scope: DealLineItemScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function toDealLineItemRecord(lineItem: DealLineItem): DealLineItemRecord {
  return {
    id: lineItem.id,
    tenantId: lineItem.tenantId,
    workspaceId: lineItem.workspaceId,
    dealId: lineItem.dealId,
    name: lineItem.name,
    description: lineItem.description,
    quantity: lineItem.quantity.toNumber(),
    unitPrice: lineItem.unitPrice.toNumber(),
    discount: lineItem.discount.toNumber(),
    tax: lineItem.tax.toNumber(),
    subtotal: lineItem.subtotal.toNumber(),
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
