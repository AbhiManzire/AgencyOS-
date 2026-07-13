export const PROJECT_TEMPLATE_DOMAIN_ERROR_CODES = {
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  TEMPLATE_NAME_REQUIRED: 'TEMPLATE_NAME_REQUIRED',
  TEMPLATE_NAME_NOT_UNIQUE: 'TEMPLATE_NAME_NOT_UNIQUE',
  TEMPLATE_ARCHIVED: 'TEMPLATE_ARCHIVED',
  INVALID_SERVICE_TYPE: 'INVALID_SERVICE_TYPE',
} as const;

export type ProjectTemplateDomainErrorCode =
  (typeof PROJECT_TEMPLATE_DOMAIN_ERROR_CODES)[keyof typeof PROJECT_TEMPLATE_DOMAIN_ERROR_CODES];

export class ProjectTemplateDomainError extends Error {
  readonly code: ProjectTemplateDomainErrorCode;

  constructor(code: ProjectTemplateDomainErrorCode, message: string) {
    super(message);
    this.name = 'ProjectTemplateDomainError';
    this.code = code;
  }
}
