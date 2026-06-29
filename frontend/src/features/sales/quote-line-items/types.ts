export interface QuoteLineItemListItem {
  readonly id: string;
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
}

export interface LineItemFormValues {
  readonly name: string;
  readonly description: string;
  readonly quantity: string;
  readonly unit: string;
  readonly unitPrice: string;
  readonly discount: string;
  readonly tax: string;
}

export interface LineItemFormErrors {
  name?: string;
  quantity?: string;
  unitPrice?: string;
  discount?: string;
  tax?: string;
  form?: string;
}

export type LineItemDrawerMode = 'create' | 'edit';
