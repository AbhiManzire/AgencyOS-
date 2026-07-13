export const FOLLOW_UP_DOMAIN_ERROR_CODES = {
  FOLLOW_UP_NOT_FOUND: 'FOLLOW_UP_NOT_FOUND',
  INVALID_FOLLOW_UP_DATE: 'INVALID_FOLLOW_UP_DATE',
  INVALID_FOLLOW_UP_TIME: 'INVALID_FOLLOW_UP_TIME',
  INVALID_SCHEDULED_AT: 'INVALID_SCHEDULED_AT',
  TITLE_REQUIRED: 'TITLE_REQUIRED',
  ASSIGNEE_REQUIRED: 'ASSIGNEE_REQUIRED',
  ENTITY_REQUIRED: 'ENTITY_REQUIRED',
  NOT_MUTABLE: 'NOT_MUTABLE',
} as const;

export type FollowUpDomainErrorCode =
  (typeof FOLLOW_UP_DOMAIN_ERROR_CODES)[keyof typeof FOLLOW_UP_DOMAIN_ERROR_CODES];

export class FollowUpDomainError extends Error {
  readonly code: FollowUpDomainErrorCode;

  constructor(code: FollowUpDomainErrorCode, message: string) {
    super(message);
    this.name = 'FollowUpDomainError';
    this.code = code;
  }
}
