export const DEAL_LINE_ITEM_DOMAIN_ERROR_CODES = {
  LINE_ITEM_NOT_FOUND: 'LINE_ITEM_NOT_FOUND',
  LINE_ITEM_ARCHIVED: 'LINE_ITEM_ARCHIVED',
  NAME_REQUIRED: 'NAME_REQUIRED',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  INVALID_UNIT_PRICE: 'INVALID_UNIT_PRICE',
  INVALID_DISCOUNT: 'INVALID_DISCOUNT',
  INVALID_TAX: 'INVALID_TAX',
  INVALID_SORT_ORDER: 'INVALID_SORT_ORDER',
  DEAL_NOT_FOUND: 'DEAL_NOT_FOUND',
  DEAL_ARCHIVED: 'DEAL_ARCHIVED',
} as const;

export type DealLineItemDomainErrorCode =
  (typeof DEAL_LINE_ITEM_DOMAIN_ERROR_CODES)[keyof typeof DEAL_LINE_ITEM_DOMAIN_ERROR_CODES];

export class DealLineItemDomainError extends Error {
  readonly code: DealLineItemDomainErrorCode;

  constructor(code: DealLineItemDomainErrorCode, message: string) {
    super(message);
    this.name = 'DealLineItemDomainError';
    this.code = code;
  }
}
