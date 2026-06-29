import type { QuoteStatus } from '@/features/sales/quotes/types';

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
  readonly validUntil: string | null;
  readonly currency: string;
  readonly totalAmount: number;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListQuotesParams {
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
  readonly skip: number;
  readonly take: number;
}

export interface CreateQuotePayload {
  readonly dealId: string;
  readonly clientId: string;
  readonly quoteNumber?: string;
  readonly title: string;
  readonly status?: QuoteStatus;
  readonly validUntil?: string | null;
  readonly currency?: string;
  readonly totalAmount: number;
  readonly notes?: string | null;
}

export interface UpdateQuotePayload {
  readonly dealId?: string;
  readonly clientId?: string;
  readonly quoteNumber?: string;
  readonly title?: string;
  readonly status?: QuoteStatus;
  readonly validUntil?: string | null;
  readonly currency?: string;
  readonly totalAmount?: number;
  readonly notes?: string | null;
}
