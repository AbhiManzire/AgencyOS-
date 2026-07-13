export const PROJECT_DELIVERY_DOMAIN_ERROR_CODES = {
  DEAL_NOT_FOUND: 'DEAL_NOT_FOUND',
  DEAL_NOT_WON: 'DEAL_NOT_WON',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  CLIENT_NOT_FOUND: 'CLIENT_NOT_FOUND',
  PRIMARY_CONTACT_NOT_FOUND: 'PRIMARY_CONTACT_NOT_FOUND',
} as const;

export type ProjectDeliveryDomainErrorCode =
  (typeof PROJECT_DELIVERY_DOMAIN_ERROR_CODES)[keyof typeof PROJECT_DELIVERY_DOMAIN_ERROR_CODES];

export class ProjectDeliveryDomainError extends Error {
  readonly code: ProjectDeliveryDomainErrorCode;

  constructor(code: ProjectDeliveryDomainErrorCode, message: string) {
    super(message);
    this.name = 'ProjectDeliveryDomainError';
    this.code = code;
  }
}
