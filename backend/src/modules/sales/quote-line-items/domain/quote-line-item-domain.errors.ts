export const QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES = {
  LINE_ITEM_NOT_FOUND: 'LINE_ITEM_NOT_FOUND',
  LINE_ITEM_ARCHIVED: 'LINE_ITEM_ARCHIVED',
  NAME_REQUIRED: 'NAME_REQUIRED',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  INVALID_UNIT_PRICE: 'INVALID_UNIT_PRICE',
  INVALID_DISCOUNT: 'INVALID_DISCOUNT',
  INVALID_TAX: 'INVALID_TAX',
  INVALID_SORT_ORDER: 'INVALID_SORT_ORDER',
  QUOTE_NOT_FOUND: 'QUOTE_NOT_FOUND',
  QUOTE_ARCHIVED: 'QUOTE_ARCHIVED',
} as const;

export type QuoteLineItemDomainErrorCode =
  (typeof QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES)[keyof typeof QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES];

export class QuoteLineItemDomainError extends Error {
  readonly code: QuoteLineItemDomainErrorCode;

  constructor(code: QuoteLineItemDomainErrorCode, message: string) {
    super(message);
    this.name = 'QuoteLineItemDomainError';
    this.code = code;
  }
}
