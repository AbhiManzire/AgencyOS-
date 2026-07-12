export const FILE_DOMAIN_ERROR_CODES = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_REQUIRED: 'FILE_REQUIRED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  WORKSPACE_OWNERSHIP_MISMATCH: 'WORKSPACE_OWNERSHIP_MISMATCH',
} as const;

export type FileDomainErrorCode =
  (typeof FILE_DOMAIN_ERROR_CODES)[keyof typeof FILE_DOMAIN_ERROR_CODES];

export class FileDomainError extends Error {
  readonly code: FileDomainErrorCode;

  constructor(code: FileDomainErrorCode, message: string) {
    super(message);
    this.name = 'FileDomainError';
    this.code = code;
  }
}
