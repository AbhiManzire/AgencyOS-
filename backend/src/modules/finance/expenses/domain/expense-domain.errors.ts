export const EXPENSE_DOMAIN_ERROR_CODES = {
  EXPENSE_NOT_FOUND: 'EXPENSE_NOT_FOUND',
  EXPENSE_ARCHIVED: 'EXPENSE_ARCHIVED',
  CATEGORY_REQUIRED: 'CATEGORY_REQUIRED',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_TAX_AMOUNT: 'INVALID_TAX_AMOUNT',
  INVALID_CURRENCY: 'INVALID_CURRENCY',
  INVALID_APPROVAL_STATUS: 'INVALID_APPROVAL_STATUS',
  ALREADY_APPROVED: 'ALREADY_APPROVED',
  ALREADY_REJECTED: 'ALREADY_REJECTED',
  WORKSPACE_OWNERSHIP_MISMATCH: 'WORKSPACE_OWNERSHIP_MISMATCH',
} as const;

export type ExpenseDomainErrorCode =
  (typeof EXPENSE_DOMAIN_ERROR_CODES)[keyof typeof EXPENSE_DOMAIN_ERROR_CODES];

export class ExpenseDomainError extends Error {
  readonly code: ExpenseDomainErrorCode;

  constructor(code: ExpenseDomainErrorCode, message: string) {
    super(message);
    this.name = 'ExpenseDomainError';
    this.code = code;
  }
}
