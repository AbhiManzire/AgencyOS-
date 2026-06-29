export interface LineItemPricingInput {
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount: number;
  readonly tax: number;
}

export interface QuoteLineItemPricingRecord {
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount: number;
  readonly tax: number;
  readonly total: number;
}

export interface QuotePricingSummary {
  readonly subtotal: number;
  readonly discountTotal: number;
  readonly taxTotal: number;
  readonly grandTotal: number;
}

/** Rounds currency values to two decimal places. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Calculates a single line item total from quantity, price, discount, and tax. */
export function calculateLineItemTotal(input: LineItemPricingInput): number {
  const lineSubtotal = roundMoney(input.quantity * input.unitPrice);
  return roundMoney(Math.max(0, lineSubtotal - input.discount + input.tax));
}

/** Aggregates quote pricing totals from line items. */
export function calculateQuotePricingSummary(
  items: readonly QuoteLineItemPricingRecord[],
): QuotePricingSummary {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const discountTotal = roundMoney(items.reduce((sum, item) => sum + item.discount, 0));
  const taxTotal = roundMoney(items.reduce((sum, item) => sum + item.tax, 0));
  const grandTotal = roundMoney(items.reduce((sum, item) => sum + item.total, 0));

  return {
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal,
  };
}
