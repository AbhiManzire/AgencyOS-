import type { ApprovalStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export interface PaymentScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface PaymentRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly clientName: string;
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

export interface CreatePaymentData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly invoiceId: string;
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

export interface ListPaymentsParams {
  readonly scope: PaymentScope;
  readonly skip?: number;
  readonly take?: number;
  readonly invoiceId?: string;
  readonly status?: PaymentStatus;
  readonly includeArchived?: boolean;
}

export interface ListPaymentsResult {
  readonly items: readonly PaymentRecord[];
  readonly total: number;
}

export interface PaymentRepository {
  create(data: CreatePaymentData): Promise<PaymentRecord>;
  findById(
    scope: PaymentScope,
    id: string,
    options?: { includeArchived?: boolean },
  ): Promise<PaymentRecord | null>;
  list(params: ListPaymentsParams): Promise<ListPaymentsResult>;
  sumCompletedAmount(scope: PaymentScope, invoiceId: string): Promise<number>;
  softDelete(
    scope: PaymentScope,
    id: string,
    data: {
      deletedAt: Date;
      deletedByUserId: string | null;
      updatedAt: Date;
      updatedByUserId: string | null;
      status: PaymentStatus;
    },
  ): Promise<PaymentRecord | null>;
}
