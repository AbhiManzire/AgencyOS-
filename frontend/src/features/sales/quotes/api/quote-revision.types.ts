export interface QuoteRevisionRecord {
  readonly id: string;
  readonly quoteId: string;
  readonly revision: number;
  readonly title: string;
  readonly status: string;
  readonly totalAmount: number;
  readonly currency: string;
  readonly validUntil: string | null;
  readonly lineItemsJson: unknown;
  readonly createdAt: string;
  readonly createdByUserId: string | null;
}
