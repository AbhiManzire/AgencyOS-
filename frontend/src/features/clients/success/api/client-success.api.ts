import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ClientHealthResult,
  ClientMetrics,
  ClientSuccessDashboard,
  ClientWorkspaceResult,
  ConvertFromDealPayload,
  ConvertFromDealResult,
  ListClientTimelineParams,
  MergeClientsPayload,
  MergeClientsResult,
} from '@/features/clients/success/api/client-success.types';

/** Fetches Client Success dashboard KPIs. */
export async function getClientSuccessDashboard(): Promise<ClientSuccessDashboard> {
  const response = await apiClient.get<ApiSuccessResponse<ClientSuccessDashboard>>(
    '/clients/success/dashboard',
  );
  return response.data.data;
}

/** Activates a client from a won deal (idempotent). */
export async function convertClientFromDeal(
  payload: ConvertFromDealPayload,
): Promise<ConvertFromDealResult> {
  const response = await apiClient.post<ApiSuccessResponse<ConvertFromDealResult>>(
    '/clients/convert-from-deal',
    payload,
  );
  return response.data.data;
}

/** Merges source client into target client. */
export async function mergeClients(payload: MergeClientsPayload): Promise<MergeClientsResult> {
  const response = await apiClient.post<ApiSuccessResponse<MergeClientsResult>>(
    '/clients/merge',
    payload,
  );
  return response.data.data;
}

/** Fetches auto-calculated client metrics. */
export async function getClientMetrics(clientId: string): Promise<ClientMetrics> {
  const response = await apiClient.get<ApiSuccessResponse<ClientMetrics>>(
    `/clients/${clientId}/metrics`,
  );
  return response.data.data;
}

/** Fetches current client health score and factors. */
export async function getClientHealth(clientId: string): Promise<ClientHealthResult> {
  const response = await apiClient.get<ApiSuccessResponse<ClientHealthResult>>(
    `/clients/${clientId}/health`,
  );
  return response.data.data;
}

/** Recalculates and persists client health. */
export async function refreshClientHealth(clientId: string): Promise<ClientHealthResult> {
  const response = await apiClient.post<ApiSuccessResponse<ClientHealthResult>>(
    `/clients/${clientId}/health/refresh`,
    {},
  );
  return response.data.data;
}

/** Fetches the full client success workspace payload. */
export async function getClientWorkspace(clientId: string): Promise<ClientWorkspaceResult> {
  const response = await apiClient.get<ApiSuccessResponse<ClientWorkspaceResult>>(
    `/clients/${clientId}/workspace`,
  );
  return response.data.data;
}

/** Fetches client timeline activities (paginated). */
export async function getClientTimeline(
  clientId: string,
  params: ListClientTimelineParams = {},
): Promise<{ readonly items: readonly unknown[]; readonly total: number }> {
  const response = await apiClient.get<ApiSuccessResponse<readonly unknown[]>>(
    `/clients/${clientId}/timeline`,
    { params },
  );
  return {
    items: response.data.data,
    total: response.data.meta?.total ?? response.data.data.length,
  };
}
