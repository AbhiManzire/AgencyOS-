export const PROPOSAL_DOMAIN_ERROR_CODES = {
  PROPOSAL_NOT_FOUND: 'PROPOSAL_NOT_FOUND',
  PROPOSAL_ARCHIVED: 'PROPOSAL_ARCHIVED',
  TITLE_REQUIRED: 'TITLE_REQUIRED',
  INVALID_VERSION: 'INVALID_VERSION',
  INVALID_STATUS: 'INVALID_STATUS',
  DEAL_NOT_FOUND: 'DEAL_NOT_FOUND',
  DEAL_ARCHIVED: 'DEAL_ARCHIVED',
  QUOTE_NOT_FOUND: 'QUOTE_NOT_FOUND',
  QUOTE_DEAL_MISMATCH: 'QUOTE_DEAL_MISMATCH',
} as const;

export type ProposalDomainErrorCode =
  (typeof PROPOSAL_DOMAIN_ERROR_CODES)[keyof typeof PROPOSAL_DOMAIN_ERROR_CODES];

export class ProposalDomainError extends Error {
  readonly code: ProposalDomainErrorCode;

  constructor(code: ProposalDomainErrorCode, message: string) {
    super(message);
    this.name = 'ProposalDomainError';
    this.code = code;
  }
}
