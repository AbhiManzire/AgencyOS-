export const QUOTE_LINE_ITEM_REPOSITORY = Symbol('QUOTE_LINE_ITEM_REPOSITORY');

export interface QuoteLineItemScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface QuoteLineItemQuoteScope extends QuoteLineItemScope {
  readonly quoteId: string;
}

export interface QuoteLineItemRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly quoteId: string;
  readonly name: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unit: string | null;
  readonly unitPrice: number;
  readonly discount: number;
  readonly tax: number;
  readonly total: number;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateQuoteLineItemData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly quoteId: string;
  readonly name: string;
  readonly description?: string | null;
  readonly quantity: number;
  readonly unit?: string | null;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly total: number;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateQuoteLineItemData {
  readonly name?: string;
  readonly description?: string | null;
  readonly quantity?: number;
  readonly unit?: string | null;
  readonly unitPrice?: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly total?: number;
  readonly sortOrder?: number;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteQuoteLineItemData {
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface QuoteLineItemRepository {
  create(data: CreateQuoteLineItemData): Promise<QuoteLineItemRecord>;
  update(
    scope: QuoteLineItemScope,
    id: string,
    data: UpdateQuoteLineItemData,
  ): Promise<QuoteLineItemRecord | null>;
  softDelete(
    scope: QuoteLineItemScope,
    id: string,
    data: SoftDeleteQuoteLineItemData,
  ): Promise<QuoteLineItemRecord | null>;
  findById(scope: QuoteLineItemScope, id: string): Promise<QuoteLineItemRecord | null>;
  listByQuote(scope: QuoteLineItemQuoteScope): Promise<readonly QuoteLineItemRecord[]>;
  getMaxSortOrder(scope: QuoteLineItemQuoteScope): Promise<number>;
}
