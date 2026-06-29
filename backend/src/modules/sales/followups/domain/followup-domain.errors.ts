export const FOLLOWUP_DOMAIN_ERROR_CODES = {
  FOLLOWUP_NOT_FOUND: 'FOLLOWUP_NOT_FOUND',
  FOLLOWUP_ARCHIVED: 'FOLLOWUP_ARCHIVED',
  SUBJECT_REQUIRED: 'SUBJECT_REQUIRED',
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_STATUS: 'INVALID_STATUS',
  SCHEDULED_AT_REQUIRED: 'SCHEDULED_AT_REQUIRED',
  DEAL_NOT_FOUND: 'DEAL_NOT_FOUND',
  DEAL_ARCHIVED: 'DEAL_ARCHIVED',
} as const;

export type FollowUpDomainErrorCode =
  (typeof FOLLOWUP_DOMAIN_ERROR_CODES)[keyof typeof FOLLOWUP_DOMAIN_ERROR_CODES];

export class FollowUpDomainError extends Error {
  readonly code: FollowUpDomainErrorCode;

  constructor(code: FollowUpDomainErrorCode, message: string) {
    super(message);
    this.name = 'FollowUpDomainError';
    this.code = code;
  }
}
