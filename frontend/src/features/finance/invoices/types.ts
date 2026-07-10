export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';

export interface InvoiceFormValues {
  clientId: string;
  projectId: string;
  quoteId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  notes: string;
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
  readonly invoiceNumber: string;
  readonly status: InvoiceStatus;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly currency: string;
  readonly updatedAt: string;
}

export interface InvoiceFormErrors {
  clientId?: string;
  projectId?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  form?: string;
}
