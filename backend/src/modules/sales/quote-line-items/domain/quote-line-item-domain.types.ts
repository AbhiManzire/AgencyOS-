export interface CreateQuoteLineItemValidationInput {
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}

export interface UpdateQuoteLineItemValidationInput {
  readonly name?: string;
  readonly quantity?: number;
  readonly unitPrice?: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}
