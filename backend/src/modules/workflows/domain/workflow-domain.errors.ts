export const WORKFLOW_DOMAIN_ERROR_CODES = {
  WORKFLOW_NOT_FOUND: 'WORKFLOW_NOT_FOUND',
  WORKFLOW_ARCHIVED: 'WORKFLOW_ARCHIVED',
  NAME_REQUIRED: 'NAME_REQUIRED',
  TRIGGER_REQUIRED: 'TRIGGER_REQUIRED',
  ACTION_REQUIRED: 'ACTION_REQUIRED',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_TRIGGER_TYPE: 'INVALID_TRIGGER_TYPE',
  INVALID_ACTION_TYPE: 'INVALID_ACTION_TYPE',
} as const;

export type WorkflowDomainErrorCode =
  (typeof WORKFLOW_DOMAIN_ERROR_CODES)[keyof typeof WORKFLOW_DOMAIN_ERROR_CODES];

export class WorkflowDomainError extends Error {
  readonly code: WorkflowDomainErrorCode;

  constructor(code: WorkflowDomainErrorCode, message: string) {
    super(message);
    this.name = 'WorkflowDomainError';
    this.code = code;
  }
}
