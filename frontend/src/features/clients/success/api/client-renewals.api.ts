import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ClientRenewalRecord,
  CreateClientRenewalPayload,
  ListClientRenewalsParams,
  ListClientRenewalsResult,
  UpdateClientRenewalPayload,
} from '@/features/clients/success/api/client-renewals.types';

/** Lists renewals for a client. */
export async function listClientRenewals(
  clientId: string,
  params: ListClientRenewalsParams = {},
): Promise<ListClientRenewalsResult> {
  const response = await apiClient.get<ApiSuccessResponse<readonly ClientRenewalRecord[]>>(
    `/clients/${clientId}/renewals`,
    { params },
  );

  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 50,
  };
}

/** Creates a renewal for a client. */
export async function createClientRenewal(
  clientId: string,
  payload: CreateClientRenewalPayload,
): Promise<ClientRenewalRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ClientRenewalRecord>>(
    `/clients/${clientId}/renewals`,
    payload,
  );
  return response.data.data;
}

/** Fetches a single renewal. */
export async function getClientRenewal(
  clientId: string,
  renewalId: string,
): Promise<ClientRenewalRecord> {
  const response = await apiClient.get<ApiSuccessResponse<ClientRenewalRecord>>(
    `/clients/${clientId}/renewals/${renewalId}`,
  );
  return response.data.data;
}

/** Updates a renewal. */
export async function updateClientRenewal(
  clientId: string,
  renewalId: string,
  payload: UpdateClientRenewalPayload,
): Promise<ClientRenewalRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<ClientRenewalRecord>>(
    `/clients/${clientId}/renewals/${renewalId}`,
    payload,
  );
  return response.data.data;
}

/** Soft-deletes a renewal. */
export async function deleteClientRenewal(
  clientId: string,
  renewalId: string,
): Promise<ClientRenewalRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<ClientRenewalRecord>>(
    `/clients/${clientId}/renewals/${renewalId}`,
  );
  return response.data.data;
}
