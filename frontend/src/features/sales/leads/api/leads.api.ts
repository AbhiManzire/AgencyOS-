import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateLeadPayload,
  LeadRecord,
  ListLeadsParams,
  ListLeadsResult,
  RestoreLeadPayload,
  UpdateLeadPayload,
} from '@/features/sales/leads/api/lead.types';

/** Fetches a paginated list of leads for the active workspace. */
export async function listLeads(params: ListLeadsParams): Promise<ListLeadsResult> {
  const response = await apiClient.get<ApiSuccessResponse<LeadRecord[]>>('/leads', {
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

/** Fetches a single lead by id. */
export async function getLead(id: string): Promise<LeadRecord> {
  const response = await apiClient.get<ApiSuccessResponse<LeadRecord>>(`/leads/${id}`);
  return response.data.data;
}

/** Creates a lead in the active workspace. */
export async function createLead(payload: CreateLeadPayload): Promise<LeadRecord> {
  const response = await apiClient.post<ApiSuccessResponse<LeadRecord>>('/leads', payload);
  return response.data.data;
}

/** Updates an existing lead. */
export async function updateLead(id: string, payload: UpdateLeadPayload): Promise<LeadRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<LeadRecord>>(`/leads/${id}`, payload);
  return response.data.data;
}

/** Archives a lead (DELETE /leads/:id). */
export async function archiveLead(id: string): Promise<LeadRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<LeadRecord>>(`/leads/${id}`);
  return response.data.data;
}

/** Restores an archived lead. */
export async function restoreLead(
  id: string,
  payload: RestoreLeadPayload = {},
): Promise<LeadRecord> {
  const response = await apiClient.post<ApiSuccessResponse<LeadRecord>>(
    `/leads/${id}/restore`,
    payload,
  );
  return response.data.data;
}

/** Converts a lead into a client. */
export async function convertLead(id: string): Promise<LeadRecord> {
  const response = await apiClient.post<ApiSuccessResponse<LeadRecord>>(`/leads/${id}/convert`, {});
  return response.data.data;
}
