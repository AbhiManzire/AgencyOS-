import type { SalesCampaignStatus } from '@prisma/client';

export const CAMPAIGN_RESTORABLE_STATUSES: readonly SalesCampaignStatus[] = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
];

export interface CreateCampaignValidationInput {
  readonly name: string;
  readonly status?: SalesCampaignStatus;
  readonly startsAt?: Date | null;
  readonly endsAt?: Date | null;
}

export interface UpdateCampaignValidationInput {
  readonly name?: string;
  readonly status?: SalesCampaignStatus;
  readonly startsAt?: Date | null;
  readonly endsAt?: Date | null;
}

export interface RestoreCampaignValidationInput {
  readonly targetStatus?: SalesCampaignStatus;
}
