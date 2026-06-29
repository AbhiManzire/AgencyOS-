export const PROJECT_MEMBER_DOMAIN_ERROR_CODES = {
  PROJECT_MEMBER_NOT_FOUND: 'PROJECT_MEMBER_NOT_FOUND',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROJECT_ARCHIVED: 'PROJECT_ARCHIVED',
  USER_NOT_WORKSPACE_MEMBER: 'USER_NOT_WORKSPACE_MEMBER',
  MEMBER_ALREADY_EXISTS: 'MEMBER_ALREADY_EXISTS',
  LEAD_ALREADY_EXISTS: 'LEAD_ALREADY_EXISTS',
  INVALID_ROLE: 'INVALID_ROLE',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_ALLOCATION: 'INVALID_ALLOCATION',
  USER_ID_REQUIRED: 'USER_ID_REQUIRED',
} as const;

export type ProjectMemberDomainErrorCode =
  (typeof PROJECT_MEMBER_DOMAIN_ERROR_CODES)[keyof typeof PROJECT_MEMBER_DOMAIN_ERROR_CODES];

export class ProjectMemberDomainError extends Error {
  readonly code: ProjectMemberDomainErrorCode;

  constructor(code: ProjectMemberDomainErrorCode, message: string) {
    super(message);
    this.name = 'ProjectMemberDomainError';
    this.code = code;
  }
}
