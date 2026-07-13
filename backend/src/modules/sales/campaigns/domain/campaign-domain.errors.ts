export const CAMPAIGN_DOMAIN_ERROR_CODES = {
  CAMPAIGN_NOT_FOUND: 'CAMPAIGN_NOT_FOUND',
  CAMPAIGN_ARCHIVED: 'CAMPAIGN_ARCHIVED',
  CAMPAIGN_NOT_ARCHIVED: 'CAMPAIGN_NOT_ARCHIVED',
  NAME_REQUIRED: 'NAME_REQUIRED',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
} as const;

export type CampaignDomainErrorCode =
  (typeof CAMPAIGN_DOMAIN_ERROR_CODES)[keyof typeof CAMPAIGN_DOMAIN_ERROR_CODES];

export class CampaignDomainError extends Error {
  readonly code: CampaignDomainErrorCode;

  constructor(code: CampaignDomainErrorCode, message: string) {
    super(message);
    this.name = 'CampaignDomainError';
    this.code = code;
  }
}
