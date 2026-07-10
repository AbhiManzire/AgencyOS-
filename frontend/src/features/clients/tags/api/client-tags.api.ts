import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  AssignClientTagPayload,
  ClientTagRecord,
} from '@/features/clients/tags/api/client-tag.types';

/** Lists tags assigned to a client. */
export async function listClientTags(clientId: string): Promise<readonly ClientTagRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<ClientTagRecord[]>>(
    `/clients/${clientId}/tags`,
  );
  return response.data.data;
}

/** Creates or reuses a workspace tag and assigns it to the client. */
export async function assignClientTag(
  clientId: string,
  payload: AssignClientTagPayload,
): Promise<ClientTagRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ClientTagRecord>>(
    `/clients/${clientId}/tags`,
    payload,
  );
  return response.data.data;
}

/** Removes a tag assignment from the client. */
export async function unassignClientTag(clientId: string, tagId: string): Promise<void> {
  await apiClient.delete(`/clients/${clientId}/tags/${tagId}`);
}
