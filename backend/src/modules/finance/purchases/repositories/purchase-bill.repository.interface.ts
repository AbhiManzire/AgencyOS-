import type { Prisma, PurchaseBillStatus } from '@prisma/client';

export const PURCHASE_BILL_REPOSITORY = Symbol('PURCHASE_BILL_REPOSITORY');

export interface PurchaseBillScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export type PurchaseBillTransactionClient = Prisma.TransactionClient;

export type PurchaseBillListSortField =
  'updatedAt' | 'createdAt' | 'issueDate' | 'dueDate' | 'billNumber';

export interface PurchaseBillRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly vendorId: string;
  readonly billNumber: string;
  readonly status: PurchaseBillStatus;
  readonly issueDate: Date;
  readonly dueDate: Date;
  readonly currency: string;
  readonly notes: string | null;
  readonly subtotal: number;
  readonly taxAmount: number;
  readonly grandTotal: number;
  readonly balanceDue: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreatePurchaseBillData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly vendorId: string;
  readonly billNumber: string;
  readonly status?: PurchaseBillStatus;
  readonly issueDate: Date;
  readonly dueDate: Date;
  readonly currency: string;
  readonly notes?: string | null;
  readonly subtotal?: number;
  readonly taxAmount?: number;
  readonly grandTotal?: number;
  readonly balanceDue?: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdatePurchaseBillData {
  readonly vendorId?: string;
  readonly billNumber?: string;
  readonly status?: PurchaseBillStatus;
  readonly issueDate?: Date;
  readonly dueDate?: Date;
  readonly currency?: string;
  readonly notes?: string | null;
  readonly subtotal?: number;
  readonly taxAmount?: number;
  readonly grandTotal?: number;
  readonly balanceDue?: number;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ArchivePurchaseBillData {
  readonly deletedAt: Date;
  readonly deletedByUserId: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface FindPurchaseBillByIdOptions {
  readonly includeArchived?: boolean;
}

export interface ListPurchaseBillsParams {
  readonly scope: PurchaseBillScope;
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly vendorId?: string;
  readonly status?: PurchaseBillStatus;
  readonly includeArchived?: boolean;
  readonly sortBy?: PurchaseBillListSortField;
  readonly sortOrder?: 'asc' | 'desc';
}

export interface ListPurchaseBillsResult {
  readonly items: readonly PurchaseBillRecord[];
  readonly total: number;
}

export interface PurchaseBillRepository {
  create(
    data: CreatePurchaseBillData,
    tx?: PurchaseBillTransactionClient,
  ): Promise<PurchaseBillRecord>;
  update(
    scope: PurchaseBillScope,
    id: string,
    data: UpdatePurchaseBillData,
    tx?: PurchaseBillTransactionClient,
  ): Promise<PurchaseBillRecord | null>;
  archive(
    scope: PurchaseBillScope,
    id: string,
    data: ArchivePurchaseBillData,
    tx?: PurchaseBillTransactionClient,
  ): Promise<PurchaseBillRecord | null>;
  findById(
    scope: PurchaseBillScope,
    id: string,
    options?: FindPurchaseBillByIdOptions,
  ): Promise<PurchaseBillRecord | null>;
  list(params: ListPurchaseBillsParams): Promise<ListPurchaseBillsResult>;
}
