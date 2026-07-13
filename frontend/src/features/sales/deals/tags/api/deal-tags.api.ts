import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  AssignDealTagPayload,
  DealTagRecord,
} from '@/features/sales/deals/tags/api/deal-tag.types';

/** Lists tags assigned to a deal. */
export async function listDealTags(dealId: string): Promise<readonly DealTagRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<DealTagRecord[]>>(
    `/deals/${dealId}/tags`,
  );
  return response.data.data;
}

/** Creates or reuses a workspace tag and assigns it to the deal. */
export async function assignDealTag(
  dealId: string,
  payload: AssignDealTagPayload,
): Promise<DealTagRecord> {
  const response = await apiClient.post<ApiSuccessResponse<DealTagRecord>>(
    `/deals/${dealId}/tags`,
    payload,
  );
  return response.data.data;
}

/** Removes a tag assignment from the deal. */
export async function unassignDealTag(dealId: string, tagId: string): Promise<void> {
  await apiClient.delete(`/deals/${dealId}/tags/${tagId}`);
}
