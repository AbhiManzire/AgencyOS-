export const SALES_TASK_DOMAIN_ERROR_CODES = {
  SALES_TASK_NOT_FOUND: 'SALES_TASK_NOT_FOUND',
  SALES_TASK_ARCHIVED: 'SALES_TASK_ARCHIVED',
  TITLE_REQUIRED: 'TITLE_REQUIRED',
  OWNER_REQUIRED: 'OWNER_REQUIRED',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_PRIORITY: 'INVALID_PRIORITY',
  INVALID_DUE_DATE: 'INVALID_DUE_DATE',
  INVALID_DUE_TIME: 'INVALID_DUE_TIME',
  INVALID_DUE_AT: 'INVALID_DUE_AT',
  NOT_MUTABLE: 'NOT_MUTABLE',
} as const;

export type SalesTaskDomainErrorCode =
  (typeof SALES_TASK_DOMAIN_ERROR_CODES)[keyof typeof SALES_TASK_DOMAIN_ERROR_CODES];

export class SalesTaskDomainError extends Error {
  readonly code: SalesTaskDomainErrorCode;

  constructor(code: SalesTaskDomainErrorCode, message: string) {
    super(message);
    this.name = 'SalesTaskDomainError';
    this.code = code;
  }
}
