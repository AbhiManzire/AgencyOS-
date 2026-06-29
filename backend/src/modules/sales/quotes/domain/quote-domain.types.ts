import type { QuoteStatus } from '@prisma/client';

export interface CreateQuoteValidationInput {
  readonly title: string;
  readonly quoteNumber: string;
  readonly totalAmount: number;
  readonly status?: QuoteStatus;
}

export interface UpdateQuoteValidationInput {
  readonly title?: string;
  readonly quoteNumber?: string;
  readonly totalAmount?: number;
  readonly status?: QuoteStatus;
}
