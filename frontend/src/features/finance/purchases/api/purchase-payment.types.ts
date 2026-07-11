import type {
  ApprovalStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/features/finance/shared/finance.types';

export interface PurchasePaymentRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly purchaseBillId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly method: PaymentMethod;
  readonly paidAt: string;
  readonly reference: string | null;
  readonly notes: string | null;
  readonly approvalStatus: ApprovalStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface CreatePurchasePaymentPayload {
  readonly amount: number;
  readonly currency?: string;
  readonly method: PaymentMethod;
  readonly paidAt: string;
  readonly reference?: string | null;
  readonly notes?: string | null;
  readonly approvalStatus?: ApprovalStatus;
}
