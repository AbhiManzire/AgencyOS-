export interface CreateInvoiceLineItemValidationInput {
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}

export interface UpdateInvoiceLineItemValidationInput {
  readonly name?: string;
  readonly quantity?: number;
  readonly unitPrice?: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}
