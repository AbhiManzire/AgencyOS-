export const RECURRING_DOMAIN_ERROR_CODES = {
  RECURRING_INVOICE_NOT_FOUND: 'RECURRING_INVOICE_NOT_FOUND',
  RECURRING_EXPENSE_NOT_FOUND: 'RECURRING_EXPENSE_NOT_FOUND',
  RECURRING_ARCHIVED: 'RECURRING_ARCHIVED',
  INVALID_FREQUENCY: 'RECURRING_INVALID_FREQUENCY',
  TEMPLATE_REQUIRED: 'RECURRING_TEMPLATE_REQUIRED',
  WORKSPACE_OWNERSHIP_MISMATCH: 'RECURRING_WORKSPACE_OWNERSHIP_MISMATCH',
} as const;

export type RecurringDomainErrorCode =
  (typeof RECURRING_DOMAIN_ERROR_CODES)[keyof typeof RECURRING_DOMAIN_ERROR_CODES];

export class RecurringDomainError extends Error {
  readonly code: RecurringDomainErrorCode;

  constructor(code: RecurringDomainErrorCode, message: string) {
    super(message);
    this.name = 'RecurringDomainError';
    this.code = code;
  }
}
