import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';

export type SalesCampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export interface SalesCampaignRecord {
  readonly id: string;
  readonly name: string;
  readonly code: string | null;
  readonly description: string | null;
  readonly status: SalesCampaignStatus;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
}

export interface ListCampaignsParams {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly status?: SalesCampaignStatus;
  readonly includeArchived?: boolean;
}

export async function listCampaigns(
  params: ListCampaignsParams = {},
): Promise<{ items: readonly SalesCampaignRecord[]; total: number }> {
  const response = await apiClient.get<ApiSuccessResponse<SalesCampaignRecord[]>>('/campaigns', {
    params,
  });
  return {
    items: response.data.data,
    total: response.data.meta?.total ?? response.data.data.length,
  };
}

export async function createCampaign(payload: {
  readonly name: string;
  readonly code?: string;
  readonly description?: string;
  readonly status?: SalesCampaignStatus;
  readonly startsAt?: string;
  readonly endsAt?: string;
}): Promise<SalesCampaignRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SalesCampaignRecord>>(
    '/campaigns',
    payload,
  );
  return response.data.data;
}

export async function archiveCampaign(id: string): Promise<SalesCampaignRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<SalesCampaignRecord>>(
    `/campaigns/${id}`,
  );
  return response.data.data;
}
