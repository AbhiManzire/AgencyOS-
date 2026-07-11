import type { InvoiceStatus, TaxMode } from '@/features/finance/shared/finance.types';

export type { InvoiceStatus, TaxMode };

export interface InvoiceFormValues {
  clientId: string;
  projectId: string;
  quoteId: string;
  dealId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  notes: string;
  terms: string;
  taxMode: TaxMode;
  status: InvoiceStatus;
}

export interface InvoiceListItem {
  readonly id: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly quoteId: string | null;
  readonly quoteNumber: string | null;
  readonly dealId: string | null;
  readonly invoiceNumber: string;
  readonly status: InvoiceStatus;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly currency: string;
  readonly grandTotal: number;
  readonly balanceDue: number;
  readonly updatedAt: string;
}

export interface InvoiceFormErrors {
  clientId?: string;
  projectId?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  terms?: string;
  dealId?: string;
  form?: string;
}
