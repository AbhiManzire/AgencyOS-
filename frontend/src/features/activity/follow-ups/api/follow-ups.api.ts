import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateFollowUpPayload,
  FollowUpDashboardSummary,
  FollowUpRecord,
  ListFollowUpsParams,
  ListFollowUpsResult,
  UpdateFollowUpPayload,
} from '@/features/activity/follow-ups/api/follow-up.types';

export async function listFollowUps(
  params: ListFollowUpsParams = {},
): Promise<ListFollowUpsResult> {
  const response = await apiClient.get<ApiSuccessResponse<FollowUpRecord[]>>('/follow-ups', {
    params: {
      entityType: params.entityType,
      entityId: params.entityId,
      status: params.status,
      assignedUserId: params.assignedUserId,
      from: params.from,
      to: params.to,
      skip: params.skip,
      take: params.take,
    },
  });

  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}

export async function createFollowUp(payload: CreateFollowUpPayload): Promise<FollowUpRecord> {
  const response = await apiClient.post<ApiSuccessResponse<FollowUpRecord>>('/follow-ups', payload);
  return response.data.data;
}

export async function updateFollowUp(
  followUpId: string,
  payload: UpdateFollowUpPayload,
): Promise<FollowUpRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<FollowUpRecord>>(
    `/follow-ups/${followUpId}`,
    payload,
  );
  return response.data.data;
}

export async function completeFollowUp(followUpId: string): Promise<FollowUpRecord> {
  const response = await apiClient.post<ApiSuccessResponse<FollowUpRecord>>(
    `/follow-ups/${followUpId}/complete`,
  );
  return response.data.data;
}

export async function cancelFollowUp(followUpId: string): Promise<FollowUpRecord> {
  const response = await apiClient.post<ApiSuccessResponse<FollowUpRecord>>(
    `/follow-ups/${followUpId}/cancel`,
  );
  return response.data.data;
}

export async function getFollowUpDashboardSummary(): Promise<FollowUpDashboardSummary> {
  const response = await apiClient.get<ApiSuccessResponse<FollowUpDashboardSummary>>(
    '/follow-ups/dashboard/summary',
  );
  return response.data.data;
}
