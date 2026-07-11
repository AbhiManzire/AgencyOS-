import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  AssignLeadTagPayload,
  LeadTagRecord,
} from '@/features/sales/leads/tags/api/lead-tag.types';

/** Lists tags assigned to a lead. */
export async function listLeadTags(leadId: string): Promise<readonly LeadTagRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<LeadTagRecord[]>>(
    `/leads/${leadId}/tags`,
  );
  return response.data.data;
}

/** Creates or reuses a workspace tag and assigns it to the lead. */
export async function assignLeadTag(
  leadId: string,
  payload: AssignLeadTagPayload,
): Promise<LeadTagRecord> {
  const response = await apiClient.post<ApiSuccessResponse<LeadTagRecord>>(
    `/leads/${leadId}/tags`,
    payload,
  );
  return response.data.data;
}

/** Removes a tag assignment from the lead. */
export async function unassignLeadTag(leadId: string, tagId: string): Promise<void> {
  await apiClient.delete(`/leads/${leadId}/tags/${tagId}`);
}
