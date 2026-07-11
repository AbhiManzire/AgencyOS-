import type { CreditNoteStatus } from '@/features/finance/shared/finance.types';

export type { CreditNoteStatus };

export interface CreditNoteFormValues {
  clientId: string;
  invoiceId: string;
  creditNoteNumber: string;
  issueDate: string;
  amount: string;
  taxAmount: string;
  currency: string;
  notes: string;
  status: CreditNoteStatus;
}

export interface CreditNoteFormErrors {
  clientId?: string;
  invoiceId?: string;
  creditNoteNumber?: string;
  issueDate?: string;
  amount?: string;
  taxAmount?: string;
  currency?: string;
  form?: string;
}

export interface CreditNoteListItem {
  readonly id: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly invoiceId: string | null;
  readonly creditNoteNumber: string;
  readonly issueDate: string;
  readonly amount: number;
  readonly taxAmount: number | null;
  readonly currency: string;
  readonly status: CreditNoteStatus;
  readonly appliedAmount: number;
  readonly remainingAmount: number;
  readonly updatedAt: string;
}

export interface ApplyCreditNoteFormValues {
  invoiceId: string;
  amount: string;
}

export interface ApplyCreditNoteFormErrors {
  invoiceId?: string;
  amount?: string;
  form?: string;
}
