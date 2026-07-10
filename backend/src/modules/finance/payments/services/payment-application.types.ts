import type { PaymentMethod } from '@prisma/client';
import type {
  ListPaymentsResult,
  PaymentRecord,
  PaymentScope,
} from '../repositories/payment.repository.interface';

export interface PaymentApplicationContext {
  readonly actorUserId: string;
}

export interface CreatePaymentCommand {
  readonly invoiceId: string;
  readonly amount: number;
  readonly method: PaymentMethod;
  readonly paidAt: Date;
  readonly currency?: string;
  readonly reference?: string | null;
  readonly notes?: string | null;
}

export interface ListPaymentsQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly invoiceId?: string;
  readonly status?: 'COMPLETED' | 'VOIDED';
}

export interface InvoicePaymentSummary {
  readonly invoiceId: string;
  readonly currency: string;
  readonly grandTotal: number;
  readonly amountPaid: number;
  readonly outstandingAmount: number;
  readonly invoiceStatus: string;
}

export type { ListPaymentsResult, PaymentRecord, PaymentScope };
