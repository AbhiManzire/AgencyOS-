import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ClientRecord,
  CreateClientPayload,
  GetClientParams,
  ListClientsParams,
  ListClientsResult,
  RestoreClientPayload,
  UpdateClientPayload,
  WorkspaceOwnerOption,
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

/** Fetches workspace members available as client owners. */
export async function listWorkspaceOwners(): Promise<readonly WorkspaceOwnerOption[]> {
  const response = await apiClient.get<ApiSuccessResponse<readonly WorkspaceOwnerOption[]>>(
    '/clients/workspace-owners',
  );
  return response.data.data;
}

/** Fetches a single client by id for the active workspace. */
export async function getClient(id: string, params: GetClientParams = {}): Promise<ClientRecord> {
  const response = await apiClient.get<ApiSuccessResponse<ClientRecord>>(`/clients/${id}`, {
    params,
  });
  return response.data.data;
}

/** Creates a new client in the active workspace. */
export async function createClient(payload: CreateClientPayload): Promise<ClientRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ClientRecord>>('/clients', payload);
  return response.data.data;
}

/** Updates an existing client in the active workspace. */
export async function updateClient(
  id: string,
  payload: UpdateClientPayload,
): Promise<ClientRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<ClientRecord>>(
    `/clients/${id}`,
    payload,
  );
  return response.data.data;
}

/** Archives a client in the active workspace. */
export async function archiveClient(id: string): Promise<ClientRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ClientRecord>>(
    `/clients/${id}/archive`,
    {},
  );
  return response.data.data;
}

/** Restores an archived client in the active workspace. */
export async function restoreClient(
  id: string,
  payload: RestoreClientPayload = {},
): Promise<ClientRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ClientRecord>>(
    `/clients/${id}/restore`,
    payload,
  );
  return response.data.data;
}
