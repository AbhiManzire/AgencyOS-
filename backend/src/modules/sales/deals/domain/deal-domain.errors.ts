export const DEAL_DOMAIN_ERROR_CODES = {
  DEAL_NOT_FOUND: 'DEAL_NOT_FOUND',
  DEAL_ARCHIVED: 'DEAL_ARCHIVED',
  TITLE_REQUIRED: 'TITLE_REQUIRED',
  INVALID_VALUE: 'INVALID_VALUE',
  CLIENT_NOT_FOUND: 'CLIENT_NOT_FOUND',
  CONTACT_NOT_FOUND: 'CONTACT_NOT_FOUND',
  CONTACT_CLIENT_MISMATCH: 'CONTACT_CLIENT_MISMATCH',
  INVALID_STAGE: 'INVALID_STAGE',
  WORKSPACE_OWNERSHIP_MISMATCH: 'WORKSPACE_OWNERSHIP_MISMATCH',
} as const;

export type DealDomainErrorCode =
  (typeof DEAL_DOMAIN_ERROR_CODES)[keyof typeof DEAL_DOMAIN_ERROR_CODES];

export class DealDomainError extends Error {
  readonly code: DealDomainErrorCode;

  constructor(code: DealDomainErrorCode, message: string) {
    super(message);
    this.name = 'DealDomainError';
    this.code = code;
  }
}
