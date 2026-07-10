export const PAYMENT_DOMAIN_ERROR_CODES = {
  PAYMENT_AMOUNT_INVALID: 'PAYMENT_AMOUNT_INVALID',
  PAYMENT_EXCEEDS_OUTSTANDING: 'PAYMENT_EXCEEDS_OUTSTANDING',
  INVOICE_NOT_PAYABLE: 'INVOICE_NOT_PAYABLE',
  INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_ALREADY_VOIDED: 'PAYMENT_ALREADY_VOIDED',
  CURRENCY_MISMATCH: 'CURRENCY_MISMATCH',
} as const;

export type PaymentDomainErrorCode =
  (typeof PAYMENT_DOMAIN_ERROR_CODES)[keyof typeof PAYMENT_DOMAIN_ERROR_CODES];

export class PaymentDomainError extends Error {
  readonly code: PaymentDomainErrorCode;

  constructor(code: PaymentDomainErrorCode, message: string) {
    super(message);
    this.name = 'PaymentDomainError';
    this.code = code;
  }
}
