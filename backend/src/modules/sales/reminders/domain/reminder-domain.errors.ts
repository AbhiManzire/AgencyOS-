export const REMINDER_DOMAIN_ERROR_CODES = {
  REMINDER_NOT_FOUND: 'REMINDER_NOT_FOUND',
  REMINDER_ARCHIVED: 'REMINDER_ARCHIVED',
  TITLE_REQUIRED: 'TITLE_REQUIRED',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_RECURRENCE: 'INVALID_RECURRENCE',
  INVALID_REMIND_DATE: 'INVALID_REMIND_DATE',
  INVALID_REMIND_TIME: 'INVALID_REMIND_TIME',
  INVALID_REMIND_AT: 'INVALID_REMIND_AT',
  ASSIGNED_USER_REQUIRED: 'ASSIGNED_USER_REQUIRED',
  NOTIFICATION_EVENT_KEY_REQUIRED: 'NOTIFICATION_EVENT_KEY_REQUIRED',
} as const;

export type ReminderDomainErrorCode =
  (typeof REMINDER_DOMAIN_ERROR_CODES)[keyof typeof REMINDER_DOMAIN_ERROR_CODES];

export class ReminderDomainError extends Error {
  readonly code: ReminderDomainErrorCode;

  constructor(code: ReminderDomainErrorCode, message: string) {
    super(message);
    this.name = 'ReminderDomainError';
    this.code = code;
  }
}
