import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ClientRecord,
  ListClientsParams,
  ListClientsResult,
} from '@/features/clients/api/client.types';

/** Fetches a paginated list of clients for the active workspace. */
export async function listClients(params: ListClientsParams): Promise<ListClientsResult> {
  const response = await apiClient.get<ApiSuccessResponse<ClientRecord[]>>('/clients', {
    params,
  });

  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}

/** Fetches a single client by id for the active workspace. */
export async function getClient(id: string): Promise<ClientRecord> {
  const response = await apiClient.get<ApiSuccessResponse<ClientRecord>>(`/clients/${id}`);
  return response.data.data;
}
