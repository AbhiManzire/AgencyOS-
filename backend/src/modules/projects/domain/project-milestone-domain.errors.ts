export const PROJECT_MILESTONE_DOMAIN_ERROR_CODES = {
  PROJECT_MILESTONE_NOT_FOUND: 'PROJECT_MILESTONE_NOT_FOUND',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROJECT_ARCHIVED: 'PROJECT_ARCHIVED',
  USER_NOT_WORKSPACE_MEMBER: 'USER_NOT_WORKSPACE_MEMBER',
  INVALID_STATUS: 'INVALID_STATUS',
  NAME_REQUIRED: 'NAME_REQUIRED',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
} as const;

export type ProjectMilestoneDomainErrorCode =
  (typeof PROJECT_MILESTONE_DOMAIN_ERROR_CODES)[keyof typeof PROJECT_MILESTONE_DOMAIN_ERROR_CODES];

export class ProjectMilestoneDomainError extends Error {
  readonly code: ProjectMilestoneDomainErrorCode;

  constructor(code: ProjectMilestoneDomainErrorCode, message: string) {
    super(message);
    this.name = 'ProjectMilestoneDomainError';
    this.code = code;
  }
}
