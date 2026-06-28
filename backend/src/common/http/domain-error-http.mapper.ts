import { HttpStatus } from '@nestjs/common';
import { CLIENT_DOMAIN_ERROR_CODES } from '../../modules/clients/domain/client-domain.errors';

/** Explicit HTTP status mapping for known Client module domain error codes. */
const CLIENT_DOMAIN_ERROR_HTTP_STATUS: Readonly<Partial<Record<string, HttpStatus>>> = {
  [CLIENT_DOMAIN_ERROR_CODES.DISPLAY_NAME_REQUIRED]: HttpStatus.BAD_REQUEST,
  [CLIENT_DOMAIN_ERROR_CODES.DISPLAY_NAME_NOT_UNIQUE]: HttpStatus.CONFLICT,
  [CLIENT_DOMAIN_ERROR_CODES.SLUG_NOT_UNIQUE]: HttpStatus.CONFLICT,
  [CLIENT_DOMAIN_ERROR_CODES.INVALID_STATUS]: HttpStatus.BAD_REQUEST,
  [CLIENT_DOMAIN_ERROR_CODES.INVALID_STATUS_TRANSITION]: HttpStatus.UNPROCESSABLE_ENTITY,
  [CLIENT_DOMAIN_ERROR_CODES.INVALID_WEBSITE]: HttpStatus.BAD_REQUEST,
  [CLIENT_DOMAIN_ERROR_CODES.INVALID_EMAIL]: HttpStatus.BAD_REQUEST,
  [CLIENT_DOMAIN_ERROR_CODES.INVALID_COUNTRY_CODE]: HttpStatus.BAD_REQUEST,
  [CLIENT_DOMAIN_ERROR_CODES.OWNER_NOT_WORKSPACE_MEMBER]: HttpStatus.UNPROCESSABLE_ENTITY,
  [CLIENT_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH]: HttpStatus.FORBIDDEN,
  [CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [CLIENT_DOMAIN_ERROR_CODES.CLIENT_ARCHIVED]: HttpStatus.UNPROCESSABLE_ENTITY,
  [CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_ARCHIVED]: HttpStatus.UNPROCESSABLE_ENTITY,
  [CLIENT_DOMAIN_ERROR_CODES.RETENTION_WINDOW_EXPIRED]: HttpStatus.UNPROCESSABLE_ENTITY,
  [CLIENT_DOMAIN_ERROR_CODES.ARCHIVE_BLOCKED_ACTIVE_PROJECTS]: HttpStatus.UNPROCESSABLE_ENTITY,
  [CLIENT_DOMAIN_ERROR_CODES.ARCHIVE_BLOCKED_OPEN_INVOICES]: HttpStatus.UNPROCESSABLE_ENTITY,
  [CLIENT_DOMAIN_ERROR_CODES.ARCHIVE_BLOCKED_RUNNING_CAMPAIGNS]: HttpStatus.UNPROCESSABLE_ENTITY,
  [CLIENT_DOMAIN_ERROR_CODES.TENANT_SCOPE_MISMATCH]: HttpStatus.FORBIDDEN,
};

/** Resolves HTTP status for any module domain error code. */
export function mapDomainErrorToHttpStatus(code: string): HttpStatus {
  const explicit = CLIENT_DOMAIN_ERROR_HTTP_STATUS[code];
  if (explicit !== undefined) {
    return explicit;
  }

  if (code.endsWith('_NOT_FOUND')) {
    return HttpStatus.NOT_FOUND;
  }

  if (code.endsWith('_NOT_UNIQUE')) {
    return HttpStatus.CONFLICT;
  }

  if (code.endsWith('_REQUIRED')) {
    return HttpStatus.BAD_REQUEST;
  }

  if (code.startsWith('INVALID_')) {
    return HttpStatus.BAD_REQUEST;
  }

  if (code.endsWith('_MISMATCH')) {
    return HttpStatus.FORBIDDEN;
  }

  if (code.includes('_BLOCKED_')) {
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }

  return HttpStatus.UNPROCESSABLE_ENTITY;
}

/** Maps a domain error code to a stable API error code string. */
export function mapDomainErrorCode(code: string): string {
  return code;
}
