import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ConnectIntegrationPayload,
  CreateIntegrationConnectionPayload,
  CreateIntegrationWebhookPayload,
  IntegrationCatalogProvider,
  IntegrationConnectionHealth,
  IntegrationConnectionRecord,
  IntegrationHealthDashboard,
  IntegrationSyncJobRecord,
  IntegrationSyncLogRecord,
  IntegrationWebhookDeliveryRecord,
  IntegrationWebhookRecord,
  ListIntegrationsParams,
  ListIntegrationsResult,
  SyncIntegrationPayload,
  UpdateIntegrationConnectionPayload,
  UpdateIntegrationWebhookPayload,
} from '@/features/integrations/api/integration.types';

function toListResult<T>(
  data: readonly T[],
  meta: ApiSuccessResponse<readonly T[]>['meta'],
  params: ListIntegrationsParams,
): ListIntegrationsResult<T> {
  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}

export async function listIntegrationCatalog(): Promise<readonly IntegrationCatalogProvider[]> {
  const response =
    await apiClient.get<ApiSuccessResponse<readonly IntegrationCatalogProvider[]>>(
      '/integrations/catalog',
    );
  return response.data.data;
}

export async function listIntegrationConnections(
  params: ListIntegrationsParams = {},
): Promise<ListIntegrationsResult<IntegrationConnectionRecord>> {
  const response = await apiClient.get<ApiSuccessResponse<IntegrationConnectionRecord[]>>(
    '/integrations/connections',
    { params },
  );
  return toListResult(response.data.data, response.data.meta, params);
}

export async function getIntegrationConnection(
  connectionId: string,
): Promise<IntegrationConnectionRecord> {
  const response = await apiClient.get<ApiSuccessResponse<IntegrationConnectionRecord>>(
    `/integrations/connections/${connectionId}`,
  );
  return response.data.data;
}

export async function createIntegrationConnection(
  payload: CreateIntegrationConnectionPayload,
): Promise<IntegrationConnectionRecord> {
  const response = await apiClient.post<ApiSuccessResponse<IntegrationConnectionRecord>>(
    '/integrations/connections',
    payload,
  );
  return response.data.data;
}

export async function updateIntegrationConnection(
  connectionId: string,
  payload: UpdateIntegrationConnectionPayload,
): Promise<IntegrationConnectionRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<IntegrationConnectionRecord>>(
    `/integrations/connections/${connectionId}`,
    payload,
  );
  return response.data.data;
}

export async function deleteIntegrationConnection(
  connectionId: string,
): Promise<IntegrationConnectionRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<IntegrationConnectionRecord>>(
    `/integrations/connections/${connectionId}`,
  );
  return response.data.data;
}

export async function connectIntegration(
  connectionId: string,
  payload: ConnectIntegrationPayload,
): Promise<IntegrationConnectionRecord> {
  const response = await apiClient.post<ApiSuccessResponse<IntegrationConnectionRecord>>(
    `/integrations/connections/${connectionId}/connect`,
    payload,
  );
  return response.data.data;
}

export async function disconnectIntegration(
  connectionId: string,
): Promise<IntegrationConnectionRecord> {
  const response = await apiClient.post<ApiSuccessResponse<IntegrationConnectionRecord>>(
    `/integrations/connections/${connectionId}/disconnect`,
  );
  return response.data.data;
}

export async function getIntegrationConnectionHealth(
  connectionId: string,
): Promise<IntegrationConnectionHealth> {
  const response = await apiClient.get<ApiSuccessResponse<IntegrationConnectionHealth>>(
    `/integrations/connections/${connectionId}/health`,
  );
  return response.data.data;
}

export async function getIntegrationHealthDashboard(): Promise<IntegrationHealthDashboard> {
  const response = await apiClient.get<ApiSuccessResponse<IntegrationHealthDashboard>>(
    '/integrations/health/dashboard',
  );
  return response.data.data;
}

export async function syncIntegration(
  connectionId: string,
  payload: SyncIntegrationPayload = {},
): Promise<IntegrationSyncJobRecord> {
  const response = await apiClient.post<ApiSuccessResponse<IntegrationSyncJobRecord>>(
    `/integrations/connections/${connectionId}/sync`,
    payload,
  );
  return response.data.data;
}

export async function listConnectionSyncJobs(
  connectionId: string,
  params: ListIntegrationsParams = {},
): Promise<ListIntegrationsResult<IntegrationSyncJobRecord>> {
  const response = await apiClient.get<ApiSuccessResponse<IntegrationSyncJobRecord[]>>(
    `/integrations/connections/${connectionId}/sync-jobs`,
    { params },
  );
  return toListResult(response.data.data, response.data.meta, params);
}

export async function listConnectionSyncLogs(
  connectionId: string,
  params: ListIntegrationsParams = {},
): Promise<ListIntegrationsResult<IntegrationSyncLogRecord>> {
  const response = await apiClient.get<ApiSuccessResponse<IntegrationSyncLogRecord[]>>(
    `/integrations/connections/${connectionId}/sync-logs`,
    { params },
  );
  return toListResult(response.data.data, response.data.meta, params);
}

export async function listIntegrationSyncLogs(
  params: ListIntegrationsParams = {},
): Promise<ListIntegrationsResult<IntegrationSyncLogRecord>> {
  const response = await apiClient.get<ApiSuccessResponse<IntegrationSyncLogRecord[]>>(
    '/integrations/sync-logs',
    { params },
  );
  return toListResult(response.data.data, response.data.meta, params);
}

export async function listConnectionWebhooks(
  connectionId: string,
  params: ListIntegrationsParams = {},
): Promise<ListIntegrationsResult<IntegrationWebhookRecord>> {
  const response = await apiClient.get<ApiSuccessResponse<IntegrationWebhookRecord[]>>(
    `/integrations/connections/${connectionId}/webhooks`,
    { params },
  );
  return toListResult(response.data.data, response.data.meta, params);
}

export async function createConnectionWebhook(
  connectionId: string,
  payload: CreateIntegrationWebhookPayload,
): Promise<IntegrationWebhookRecord> {
  const response = await apiClient.post<ApiSuccessResponse<IntegrationWebhookRecord>>(
    `/integrations/connections/${connectionId}/webhooks`,
    payload,
  );
  return response.data.data;
}

export async function updateConnectionWebhook(
  connectionId: string,
  webhookId: string,
  payload: UpdateIntegrationWebhookPayload,
): Promise<IntegrationWebhookRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<IntegrationWebhookRecord>>(
    `/integrations/connections/${connectionId}/webhooks/${webhookId}`,
    payload,
  );
  return response.data.data;
}

export async function deleteConnectionWebhook(
  connectionId: string,
  webhookId: string,
): Promise<IntegrationWebhookRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<IntegrationWebhookRecord>>(
    `/integrations/connections/${connectionId}/webhooks/${webhookId}`,
  );
  return response.data.data;
}

export async function listWebhookDeliveries(
  params: ListIntegrationsParams = {},
): Promise<ListIntegrationsResult<IntegrationWebhookDeliveryRecord>> {
  const response = await apiClient.get<ApiSuccessResponse<IntegrationWebhookDeliveryRecord[]>>(
    '/integrations/webhooks/deliveries',
    { params },
  );
  return toListResult(response.data.data, response.data.meta, params);
}
