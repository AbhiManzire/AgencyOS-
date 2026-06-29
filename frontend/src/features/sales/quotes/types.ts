export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface QuoteFormValues {
  dealId: string;
  clientId: string;
  title: string;
  validUntil: string;
  currency: string;
  totalAmount: string;
  notes: string;
  status: QuoteStatus;
}

export interface QuoteListItem {
  readonly id: string;
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
  readonly updatedAt: string;
}
