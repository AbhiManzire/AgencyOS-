export const INVOICE_DELIVERY_DOMAIN_ERROR_CODES = {
  NO_LINE_ITEMS: 'NO_LINE_ITEMS',
  PDF_NOT_FOUND: 'PDF_NOT_FOUND',
  RECIPIENT_EMAIL_REQUIRED: 'RECIPIENT_EMAIL_REQUIRED',
  EMAIL_DELIVERY_FAILED: 'EMAIL_DELIVERY_FAILED',
} as const;

export type InvoiceDeliveryDomainErrorCode =
  (typeof INVOICE_DELIVERY_DOMAIN_ERROR_CODES)[keyof typeof INVOICE_DELIVERY_DOMAIN_ERROR_CODES];

export class InvoiceDeliveryDomainError extends Error {
  readonly code: InvoiceDeliveryDomainErrorCode;

  constructor(code: InvoiceDeliveryDomainErrorCode, message: string) {
    super(message);
    this.name = 'InvoiceDeliveryDomainError';
    this.code = code;
  }
}
