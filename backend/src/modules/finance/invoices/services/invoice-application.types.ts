import type { InvoiceStatus } from '@prisma/client';
import type {
  InvoiceRecord,
  InvoiceScope,
  ListInvoicesResult,
} from '../repositories/invoice.repository.interface';

export type { InvoiceRecord, InvoiceScope, ListInvoicesResult };

export interface InvoiceApplicationContext {
  readonly actorUserId: string;
}

export interface CreateInvoiceCommand {
  readonly clientId: string;
  readonly projectId: string;
  readonly quoteId?: string | null;
  readonly invoiceNumber?: string;
  readonly status?: InvoiceStatus;
  readonly issueDate: Date;
  readonly dueDate: Date;
  readonly currency?: string;
  readonly notes?: string | null;
}

export interface UpdateInvoiceCommand {
  readonly clientId?: string;
  readonly projectId?: string;
  readonly quoteId?: string | null;
  readonly invoiceNumber?: string;
  readonly status?: InvoiceStatus;
  readonly issueDate?: Date;
  readonly dueDate?: Date;
  readonly currency?: string;
  readonly notes?: string | null;
}

export interface ListInvoicesQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly status?: InvoiceStatus;
  readonly clientId?: string;
  readonly projectId?: string;
  readonly quoteId?: string;
  readonly includeArchived?: boolean;
}
