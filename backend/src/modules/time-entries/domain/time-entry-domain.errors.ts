export const TIME_ENTRY_DOMAIN_ERROR_CODES = {
  TIME_ENTRY_NOT_FOUND: 'TIME_ENTRY_NOT_FOUND',
  TIME_ENTRY_ARCHIVED: 'TIME_ENTRY_ARCHIVED',
  INVALID_TIME_RANGE: 'INVALID_TIME_RANGE',
  START_TIME_REQUIRED: 'START_TIME_REQUIRED',
  END_TIME_REQUIRED: 'END_TIME_REQUIRED',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  WORKSPACE_OWNERSHIP_MISMATCH: 'WORKSPACE_OWNERSHIP_MISMATCH',
  ACTIVE_TIMER_EXISTS: 'ACTIVE_TIMER_EXISTS',
  TIMER_NOT_RUNNING: 'TIMER_NOT_RUNNING',
} as const;

export type TimeEntryDomainErrorCode =
  (typeof TIME_ENTRY_DOMAIN_ERROR_CODES)[keyof typeof TIME_ENTRY_DOMAIN_ERROR_CODES];

export class TimeEntryDomainError extends Error {
  readonly code: TimeEntryDomainErrorCode;

  constructor(code: TimeEntryDomainErrorCode, message: string) {
    super(message);
    this.name = 'TimeEntryDomainError';
    this.code = code;
  }
}
