import type {
  InvoiceLineItemRecord,
  InvoiceLineItemScope,
} from '../repositories/invoice-line-item.repository.interface';

export type { InvoiceLineItemRecord, InvoiceLineItemScope };

export interface InvoiceLineItemApplicationContext {
  readonly actorUserId: string;
}

export interface CreateInvoiceLineItemCommand {
  readonly name: string;
  readonly description?: string | null;
  readonly quantity: number;
  readonly unit?: string | null;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}

export interface UpdateInvoiceLineItemCommand {
  readonly name?: string;
  readonly description?: string | null;
  readonly quantity?: number;
  readonly unit?: string | null;
  readonly unitPrice?: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}
