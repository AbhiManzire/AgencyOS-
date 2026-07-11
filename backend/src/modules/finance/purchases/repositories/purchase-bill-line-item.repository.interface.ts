import type { Prisma } from '@prisma/client';

export const PURCHASE_BILL_LINE_ITEM_REPOSITORY = Symbol('PURCHASE_BILL_LINE_ITEM_REPOSITORY');

export interface PurchaseBillLineItemScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export type PurchaseBillLineItemTransactionClient = Prisma.TransactionClient;

export interface PurchaseBillLineItemRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly purchaseBillId: string;
  readonly name: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unit: string | null;
  readonly unitPrice: number;
  readonly discount: number;
  readonly tax: number;
  readonly total: number;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreatePurchaseBillLineItemData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly purchaseBillId: string;
  readonly name: string;
  readonly description?: string | null;
  readonly quantity: number;
  readonly unit?: string | null;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly total: number;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdatePurchaseBillLineItemData {
  readonly name?: string;
  readonly description?: string | null;
  readonly quantity?: number;
  readonly unit?: string | null;
  readonly unitPrice?: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly total?: number;
  readonly sortOrder?: number;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeletePurchaseBillLineItemData {
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface PurchaseBillLineItemRepository {
  create(
    data: CreatePurchaseBillLineItemData,
    tx?: PurchaseBillLineItemTransactionClient,
  ): Promise<PurchaseBillLineItemRecord>;
  update(
    scope: PurchaseBillLineItemScope,
    id: string,
    data: UpdatePurchaseBillLineItemData,
    tx?: PurchaseBillLineItemTransactionClient,
  ): Promise<PurchaseBillLineItemRecord | null>;
  softDelete(
    scope: PurchaseBillLineItemScope,
    id: string,
    data: SoftDeletePurchaseBillLineItemData,
    tx?: PurchaseBillLineItemTransactionClient,
  ): Promise<PurchaseBillLineItemRecord | null>;
  findById(
    scope: PurchaseBillLineItemScope,
    id: string,
  ): Promise<PurchaseBillLineItemRecord | null>;
  listByBill(
    scope: PurchaseBillLineItemScope,
    purchaseBillId: string,
  ): Promise<readonly PurchaseBillLineItemRecord[]>;
}
