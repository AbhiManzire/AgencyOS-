export const INVOICE_LINE_ITEM_DOMAIN_ERROR_CODES = {
  LINE_ITEM_NOT_FOUND: 'LINE_ITEM_NOT_FOUND',
  LINE_ITEM_ARCHIVED: 'LINE_ITEM_ARCHIVED',
  NAME_REQUIRED: 'NAME_REQUIRED',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  INVALID_UNIT_PRICE: 'INVALID_UNIT_PRICE',
  INVALID_DISCOUNT: 'INVALID_DISCOUNT',
  INVALID_TAX: 'INVALID_TAX',
  INVALID_SORT_ORDER: 'INVALID_SORT_ORDER',
  INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',
  INVOICE_ARCHIVED: 'INVOICE_ARCHIVED',
} as const;

export type InvoiceLineItemDomainErrorCode =
  (typeof INVOICE_LINE_ITEM_DOMAIN_ERROR_CODES)[keyof typeof INVOICE_LINE_ITEM_DOMAIN_ERROR_CODES];

export class InvoiceLineItemDomainError extends Error {
  readonly code: InvoiceLineItemDomainErrorCode;

  constructor(code: InvoiceLineItemDomainErrorCode, message: string) {
    super(message);
    this.name = 'InvoiceLineItemDomainError';
    this.code = code;
  }
}
