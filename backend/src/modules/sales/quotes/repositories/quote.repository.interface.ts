import type { QuoteStatus } from '@prisma/client';

export const QUOTE_REPOSITORY = Symbol('QUOTE_REPOSITORY');

export interface QuoteScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface QuoteRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly dealId: string;
  readonly dealTitle: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly quoteNumber: string;
  readonly title: string;
  readonly status: QuoteStatus;
  readonly validUntil: Date | null;
  readonly currency: string;
  readonly totalAmount: number;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateQuoteData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly dealId: string;
  readonly clientId: string;
  readonly quoteNumber: string;
  readonly title: string;
  readonly status?: QuoteStatus;
  readonly validUntil?: Date | null;
  readonly currency?: string;
  readonly totalAmount: number;
  readonly notes?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateQuoteData {
  readonly dealId?: string;
  readonly clientId?: string;
  readonly quoteNumber?: string;
  readonly title?: string;
  readonly status?: QuoteStatus;
  readonly validUntil?: Date | null;
  readonly currency?: string;
  readonly totalAmount?: number;
  readonly notes?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface FindQuoteByIdOptions {
  readonly includeArchived?: boolean;
}

export interface ListQuotesParams {
  readonly scope: QuoteScope;
  readonly skip?: number;
  readonly take?: number;
  readonly status?: QuoteStatus;
  readonly dealId?: string;
  readonly clientId?: string;
  readonly includeArchived?: boolean;
}

export interface ListQuotesResult {
  readonly items: readonly QuoteRecord[];
  readonly total: number;
}

export interface QuoteRepository {
  create(data: CreateQuoteData): Promise<QuoteRecord>;
  update(scope: QuoteScope, id: string, data: UpdateQuoteData): Promise<QuoteRecord | null>;
  findById(
    scope: QuoteScope,
    id: string,
    options?: FindQuoteByIdOptions,
  ): Promise<QuoteRecord | null>;
  findByQuoteNumber(scope: QuoteScope, quoteNumber: string): Promise<QuoteRecord | null>;
  list(params: ListQuotesParams): Promise<ListQuotesResult>;
}
