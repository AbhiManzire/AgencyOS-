import type { Prisma, QuoteStatus } from '@prisma/client';
import type {
  ListQuotesResult,
  QuoteRecord,
  QuoteScope,
} from '../repositories/quote.repository.interface';

export interface QuoteApplicationContext {
  readonly actorUserId: string;
}

export interface CreateQuoteCommand {
  readonly dealId: string;
  readonly clientId: string;
  readonly quoteNumber?: string;
  readonly title: string;
  readonly status?: QuoteStatus;
  readonly validUntil?: Date | null;
  readonly currency?: string;
  readonly totalAmount: number;
  readonly notes?: string | null;
}

export interface UpdateQuoteCommand {
  readonly dealId?: string;
  readonly clientId?: string;
  readonly quoteNumber?: string;
  readonly title?: string;
  readonly status?: QuoteStatus;
  readonly validUntil?: Date | null;
  readonly currency?: string;
  readonly totalAmount?: number;
  readonly notes?: string | null;
}

export interface ListQuotesQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly status?: QuoteStatus;
  readonly dealId?: string;
  readonly clientId?: string;
  readonly includeArchived?: boolean;
}

export interface QuoteRevisionRecord {
  readonly id: string;
  readonly quoteId: string;
  readonly revision: number;
  readonly title: string;
  readonly status: QuoteStatus;
  readonly totalAmount: number;
  readonly currency: string;
  readonly validUntil: Date | null;
  readonly lineItemsJson: Prisma.JsonValue;
  readonly createdAt: Date;
  readonly createdByUserId: string | null;
}

export type { ListQuotesResult, QuoteRecord, QuoteScope };
