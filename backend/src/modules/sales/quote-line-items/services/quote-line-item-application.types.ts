import type {
  QuoteLineItemRecord,
  QuoteLineItemScope,
} from '../repositories/quote-line-item.repository.interface';

export type { QuoteLineItemRecord, QuoteLineItemScope };

export interface QuoteLineItemApplicationContext {
  readonly actorUserId: string;
}

export interface CreateQuoteLineItemCommand {
  readonly name: string;
  readonly description?: string | null;
  readonly quantity: number;
  readonly unit?: string | null;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}

export interface UpdateQuoteLineItemCommand {
  readonly name?: string;
  readonly description?: string | null;
  readonly quantity?: number;
  readonly unit?: string | null;
  readonly unitPrice?: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}
