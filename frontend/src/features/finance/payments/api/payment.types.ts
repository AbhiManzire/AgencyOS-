export type PaymentStatus = 'COMPLETED' | 'VOIDED';
export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'CASH' | 'CHECK' | 'OTHER';

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
  readonly paidAt: string;
  readonly reference: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface CreatePaymentPayload {
  readonly invoiceId: string;
  readonly amount: number;
  readonly method: PaymentMethod;
  readonly paidAt: string;
  readonly currency?: string;
  readonly reference?: string | null;
  readonly notes?: string | null;
}

export interface ListPaymentsParams {
  readonly skip?: number;
  readonly take?: number;
  readonly invoiceId?: string;
  readonly status?: PaymentStatus;
}

export interface ListPaymentsResult {
  readonly items: readonly PaymentRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface InvoicePaymentSummary {
  readonly invoiceId: string;
  readonly currency: string;
  readonly grandTotal: number;
  readonly amountPaid: number;
  readonly outstandingAmount: number;
  readonly invoiceStatus: string;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  COMPLETED: 'Completed',
  VOIDED: 'Voided',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Bank transfer',
  CARD: 'Card',
  CASH: 'Cash',
  CHECK: 'Check',
  OTHER: 'Other',
};
