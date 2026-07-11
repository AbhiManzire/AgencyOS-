export const VENDOR_DOMAIN_ERROR_CODES = {
  VENDOR_NOT_FOUND: 'VENDOR_NOT_FOUND',
  VENDOR_ARCHIVED: 'VENDOR_ARCHIVED',
  VENDOR_NOT_ARCHIVED: 'VENDOR_NOT_ARCHIVED',
  NAME_REQUIRED: 'NAME_REQUIRED',
  INVALID_CURRENCY: 'INVALID_CURRENCY',
  INVALID_PAYMENT_TERMS: 'INVALID_PAYMENT_TERMS',
  WORKSPACE_OWNERSHIP_MISMATCH: 'WORKSPACE_OWNERSHIP_MISMATCH',
} as const;

export type VendorDomainErrorCode =
  (typeof VENDOR_DOMAIN_ERROR_CODES)[keyof typeof VENDOR_DOMAIN_ERROR_CODES];

export class VendorDomainError extends Error {
  readonly code: VendorDomainErrorCode;

  constructor(code: VendorDomainErrorCode, message: string) {
    super(message);
    this.name = 'VendorDomainError';
    this.code = code;
  }
}
