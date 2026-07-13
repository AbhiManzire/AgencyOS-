import type { SalesCampaignStatus } from '@prisma/client';
import type {
  CampaignRecord,
  CampaignScope,
  ListCampaignsResult,
} from '../repositories/campaign.repository.interface';

export interface CampaignApplicationContext {
  readonly actorUserId: string;
}

export interface CreateCampaignCommand {
  readonly name: string;
  readonly code?: string | null;
  readonly description?: string | null;
  readonly status?: SalesCampaignStatus;
  readonly startsAt?: Date | null;
  readonly endsAt?: Date | null;
}

export interface UpdateCampaignCommand {
  readonly name?: string;
  readonly code?: string | null;
  readonly description?: string | null;
  readonly status?: SalesCampaignStatus;
  readonly startsAt?: Date | null;
  readonly endsAt?: Date | null;
}

export interface RestoreCampaignCommand {
  readonly targetStatus?: SalesCampaignStatus;
}

export interface ListCampaignsQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly status?: SalesCampaignStatus;
  readonly includeArchived?: boolean;
}

export type { CampaignRecord, CampaignScope, ListCampaignsResult };
