import type { InvoiceStatus } from '@prisma/client';

export interface CreateInvoiceValidationInput {
  readonly invoiceNumber: string;
  readonly issueDate: Date;
  readonly dueDate: Date;
  readonly status?: InvoiceStatus;
}

export interface UpdateInvoiceValidationInput {
  readonly invoiceNumber?: string;
  readonly issueDate?: Date;
  readonly dueDate?: Date;
  readonly status?: InvoiceStatus;
}
