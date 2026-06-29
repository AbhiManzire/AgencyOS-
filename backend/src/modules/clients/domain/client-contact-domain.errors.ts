export const CLIENT_CONTACT_DOMAIN_ERROR_CODES = {
  FIRST_NAME_REQUIRED: 'FIRST_NAME_REQUIRED',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_STATUS: 'INVALID_STATUS',
  CLIENT_CONTACT_NOT_FOUND: 'CLIENT_CONTACT_NOT_FOUND',
  PRIMARY_CONTACT_NOT_UNIQUE: 'PRIMARY_CONTACT_NOT_UNIQUE',
} as const;

export type ClientContactDomainErrorCode =
  (typeof CLIENT_CONTACT_DOMAIN_ERROR_CODES)[keyof typeof CLIENT_CONTACT_DOMAIN_ERROR_CODES];

export class ClientContactDomainError extends Error {
  readonly code: ClientContactDomainErrorCode;

  constructor(code: ClientContactDomainErrorCode, message: string) {
    super(message);
    this.name = 'ClientContactDomainError';
    this.code = code;
  }
}
