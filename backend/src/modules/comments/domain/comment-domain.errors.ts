export const COMMENT_DOMAIN_ERROR_CODES = {
  COMMENT_MESSAGE_REQUIRED: 'COMMENT_MESSAGE_REQUIRED',
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  COMMENT_ARCHIVED: 'COMMENT_ARCHIVED',
  THREAD_REPLIES_NOT_SUPPORTED: 'THREAD_REPLIES_NOT_SUPPORTED',
  WORKSPACE_OWNERSHIP_MISMATCH: 'WORKSPACE_OWNERSHIP_MISMATCH',
  TENANT_SCOPE_MISMATCH: 'TENANT_SCOPE_MISMATCH',
} as const;

export type CommentDomainErrorCode =
  (typeof COMMENT_DOMAIN_ERROR_CODES)[keyof typeof COMMENT_DOMAIN_ERROR_CODES];

export class CommentDomainError extends Error {
  readonly code: CommentDomainErrorCode;

  constructor(code: CommentDomainErrorCode, message: string) {
    super(message);
    this.name = 'CommentDomainError';
    this.code = code;
  }
}
