export const QUOTE_DOMAIN_ERROR_CODES = {
  QUOTE_NOT_FOUND: 'QUOTE_NOT_FOUND',
  QUOTE_ARCHIVED: 'QUOTE_ARCHIVED',
  TITLE_REQUIRED: 'TITLE_REQUIRED',
  QUOTE_NUMBER_REQUIRED: 'QUOTE_NUMBER_REQUIRED',
  QUOTE_NUMBER_NOT_UNIQUE: 'QUOTE_NUMBER_NOT_UNIQUE',
  INVALID_TOTAL_AMOUNT: 'INVALID_TOTAL_AMOUNT',
  INVALID_STATUS: 'INVALID_STATUS',
  CLIENT_NOT_FOUND: 'CLIENT_NOT_FOUND',
  DEAL_NOT_FOUND: 'DEAL_NOT_FOUND',
  DEAL_ARCHIVED: 'DEAL_ARCHIVED',
  DEAL_CLIENT_MISMATCH: 'DEAL_CLIENT_MISMATCH',
} as const;

export type QuoteDomainErrorCode =
  (typeof QUOTE_DOMAIN_ERROR_CODES)[keyof typeof QUOTE_DOMAIN_ERROR_CODES];

export class QuoteDomainError extends Error {
  readonly code: QuoteDomainErrorCode;

  constructor(code: QuoteDomainErrorCode, message: string) {
    super(message);
    this.name = 'QuoteDomainError';
    this.code = code;
  }
}
