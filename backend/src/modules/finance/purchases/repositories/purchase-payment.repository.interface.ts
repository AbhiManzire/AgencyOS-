import type { ApprovalStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';

export const PURCHASE_PAYMENT_REPOSITORY = Symbol('PURCHASE_PAYMENT_REPOSITORY');

export interface PurchasePaymentScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export type PurchasePaymentTransactionClient = Prisma.TransactionClient;

export interface PurchasePaymentRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly purchaseBillId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly method: PaymentMethod;
  readonly paidAt: Date;
  readonly reference: string | null;
  readonly notes: string | null;
  readonly approvalStatus: ApprovalStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreatePurchasePaymentData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly purchaseBillId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status?: PaymentStatus;
  readonly method: PaymentMethod;
  readonly paidAt: Date;
  readonly reference?: string | null;
  readonly notes?: string | null;
  readonly approvalStatus?: ApprovalStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface VoidPurchasePaymentData {
  readonly status: PaymentStatus;
  readonly deletedAt: Date;
  readonly deletedByUserId: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ListPurchasePaymentsParams {
  readonly scope: PurchasePaymentScope;
  readonly skip?: number;
  readonly take?: number;
  readonly purchaseBillId?: string;
  readonly status?: PaymentStatus;
  readonly includeArchived?: boolean;
}

export interface ListPurchasePaymentsResult {
  readonly items: readonly PurchasePaymentRecord[];
  readonly total: number;
}

export interface PurchasePaymentRepository {
  create(
    data: CreatePurchasePaymentData,
    tx?: PurchasePaymentTransactionClient,
  ): Promise<PurchasePaymentRecord>;
  void(
    scope: PurchasePaymentScope,
    id: string,
    data: VoidPurchasePaymentData,
    tx?: PurchasePaymentTransactionClient,
  ): Promise<PurchasePaymentRecord | null>;
  findById(
    scope: PurchasePaymentScope,
    id: string,
    options?: { includeArchived?: boolean },
  ): Promise<PurchasePaymentRecord | null>;
  list(params: ListPurchasePaymentsParams): Promise<ListPurchasePaymentsResult>;
  sumCompletedAmount(
    scope: PurchasePaymentScope,
    purchaseBillId: string,
    tx?: PurchasePaymentTransactionClient,
  ): Promise<number>;
}
