import { Injectable } from '@nestjs/common';
import { Prisma, type PurchaseBillLineItem } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreatePurchaseBillLineItemData,
  PurchaseBillLineItemRecord,
  PurchaseBillLineItemRepository,
  PurchaseBillLineItemScope,
  PurchaseBillLineItemTransactionClient,
  SoftDeletePurchaseBillLineItemData,
  UpdatePurchaseBillLineItemData,
} from './purchase-bill-line-item.repository.interface';

@Injectable()
export class PrismaPurchaseBillLineItemRepository implements PurchaseBillLineItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreatePurchaseBillLineItemData,
    tx?: PurchaseBillLineItemTransactionClient,
  ): Promise<PurchaseBillLineItemRecord> {
    const db = tx ?? this.prisma;
    const item = await db.purchaseBillLineItem.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        purchaseBillId: data.purchaseBillId,
        name: data.name,
        description: data.description ?? null,
        quantity: new Prisma.Decimal(data.quantity),
        unit: data.unit ?? null,
        unitPrice: new Prisma.Decimal(data.unitPrice),
        discount: new Prisma.Decimal(data.discount ?? 0),
        tax: new Prisma.Decimal(data.tax ?? 0),
        total: new Prisma.Decimal(data.total),
        sortOrder: data.sortOrder,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });
    return toRecord(item);
  }

  async update(
    scope: PurchaseBillLineItemScope,
    id: string,
    data: UpdatePurchaseBillLineItemData,
    tx?: PurchaseBillLineItemTransactionClient,
  ): Promise<PurchaseBillLineItemRecord | null> {
    const db = tx ?? this.prisma;
    const { quantity, unitPrice, discount, tax, total, ...rest } = data;
    const result = await db.purchaseBillLineItem.updateMany({
      where: activeWhere(scope, id),
      data: {
        ...rest,
        ...(quantity !== undefined ? { quantity: new Prisma.Decimal(quantity) } : {}),
        ...(unitPrice !== undefined ? { unitPrice: new Prisma.Decimal(unitPrice) } : {}),
        ...(discount !== undefined ? { discount: new Prisma.Decimal(discount) } : {}),
        ...(tax !== undefined ? { tax: new Prisma.Decimal(tax) } : {}),
        ...(total !== undefined ? { total: new Prisma.Decimal(total) } : {}),
      },
    });
    if (result.count === 0) return null;
    return this.findByIdWithClient(db, scope, id);
  }

  async softDelete(
    scope: PurchaseBillLineItemScope,
    id: string,
    data: SoftDeletePurchaseBillLineItemData,
    tx?: PurchaseBillLineItemTransactionClient,
  ): Promise<PurchaseBillLineItemRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.purchaseBillLineItem.updateMany({
      where: activeWhere(scope, id),
      data: {
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });
    if (result.count === 0) return null;
    return this.findByIdWithClient(db, scope, id);
  }

  async findById(
    scope: PurchaseBillLineItemScope,
    id: string,
  ): Promise<PurchaseBillLineItemRecord | null> {
    return this.findByIdWithClient(this.prisma, scope, id);
  }

  async listByBill(
    scope: PurchaseBillLineItemScope,
    purchaseBillId: string,
  ): Promise<readonly PurchaseBillLineItemRecord[]> {
    const items = await this.prisma.purchaseBillLineItem.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        purchaseBillId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    });
    return items.map(toRecord);
  }

  private async findByIdWithClient(
    db: PurchaseBillLineItemTransactionClient | PrismaService,
    scope: PurchaseBillLineItemScope,
    id: string,
  ): Promise<PurchaseBillLineItemRecord | null> {
    const item = await db.purchaseBillLineItem.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });
    return item ? toRecord(item) : null;
  }
}

function activeWhere(scope: PurchaseBillLineItemScope, id: string) {
  return { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId, deletedAt: null };
}

function toRecord(item: PurchaseBillLineItem): PurchaseBillLineItemRecord {
  return {
    id: item.id,
    tenantId: item.tenantId,
    workspaceId: item.workspaceId,
    purchaseBillId: item.purchaseBillId,
    name: item.name,
    description: item.description,
    quantity: Number(item.quantity),
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
    discount: Number(item.discount),
    tax: Number(item.tax),
    total: Number(item.total),
    sortOrder: item.sortOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    createdByUserId: item.createdByUserId,
    updatedByUserId: item.updatedByUserId,
    deletedAt: item.deletedAt,
    deletedByUserId: item.deletedByUserId,
  };
}
