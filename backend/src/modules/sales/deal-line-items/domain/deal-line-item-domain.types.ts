export interface CreateDealLineItemValidationInput {
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}

export interface UpdateDealLineItemValidationInput {
  readonly name?: string;
  readonly quantity?: number;
  readonly unitPrice?: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}
