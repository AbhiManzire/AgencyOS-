import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateFollowUpPayload,
  FollowUpRecord,
  UpdateFollowUpPayload,
} from '@/features/sales/follow-ups/api/follow-up.types';

/** Fetches follow-ups for a deal. */
export async function listFollowUps(dealId: string): Promise<readonly FollowUpRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<FollowUpRecord[]>>(
    `/deals/${dealId}/followups`,
  );
  return response.data.data;
}

/** Creates a follow-up on a deal. */
export async function createFollowUp(
  dealId: string,
  payload: CreateFollowUpPayload,
): Promise<FollowUpRecord> {
  const response = await apiClient.post<ApiSuccessResponse<FollowUpRecord>>(
    `/deals/${dealId}/followups`,
    payload,
  );
  return response.data.data;
}

/** Updates a follow-up. */
export async function updateFollowUp(
  followUpId: string,
  payload: UpdateFollowUpPayload,
): Promise<FollowUpRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<FollowUpRecord>>(
    `/followups/${followUpId}`,
    payload,
  );
  return response.data.data;
}

/** Deletes a follow-up. */
export async function deleteFollowUp(followUpId: string): Promise<FollowUpRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<FollowUpRecord>>(
    `/followups/${followUpId}`,
  );
  return response.data.data;
}
