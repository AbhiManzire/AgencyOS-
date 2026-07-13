import type { SalesCampaignStatus } from '@prisma/client';

export const CAMPAIGN_REPOSITORY = Symbol('CAMPAIGN_REPOSITORY');

export interface CampaignScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface CampaignRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly code: string | null;
  readonly description: string | null;
  readonly status: SalesCampaignStatus;
  readonly startsAt: Date | null;
  readonly endsAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateCampaignData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly code?: string | null;
  readonly description?: string | null;
  readonly status?: SalesCampaignStatus;
  readonly startsAt?: Date | null;
  readonly endsAt?: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateCampaignData {
  readonly name?: string;
  readonly code?: string | null;
  readonly description?: string | null;
  readonly status?: SalesCampaignStatus;
  readonly startsAt?: Date | null;
  readonly endsAt?: Date | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ArchiveCampaignData {
  readonly status: SalesCampaignStatus;
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface RestoreCampaignData {
  readonly status: SalesCampaignStatus;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface FindCampaignByIdOptions {
  readonly includeArchived?: boolean;
}

export interface ListCampaignsParams {
  readonly scope: CampaignScope;
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly status?: SalesCampaignStatus;
  readonly includeArchived?: boolean;
}

export interface ListCampaignsResult {
  readonly items: readonly CampaignRecord[];
  readonly total: number;
}

export interface CampaignRepository {
  create(data: CreateCampaignData): Promise<CampaignRecord>;
  update(
    scope: CampaignScope,
    id: string,
    data: UpdateCampaignData,
  ): Promise<CampaignRecord | null>;
  archive(
    scope: CampaignScope,
    id: string,
    data: ArchiveCampaignData,
  ): Promise<CampaignRecord | null>;
  restore(
    scope: CampaignScope,
    id: string,
    data: RestoreCampaignData,
  ): Promise<CampaignRecord | null>;
  findById(
    scope: CampaignScope,
    id: string,
    options?: FindCampaignByIdOptions,
  ): Promise<CampaignRecord | null>;
  findByCode(scope: CampaignScope, code: string): Promise<CampaignRecord | null>;
  list(params: ListCampaignsParams): Promise<ListCampaignsResult>;
}
