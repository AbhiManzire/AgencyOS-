import type { ListIntegrationsParams } from '@/features/integrations/api/integration.types';

export const integrationsQueryKeys = {
  all: ['integrations'] as const,
  catalog: () => [...integrationsQueryKeys.all, 'catalog'] as const,
  connections: (params: ListIntegrationsParams = {}) =>
    [...integrationsQueryKeys.all, 'connections', params] as const,
  connection: (connectionId: string) =>
    [...integrationsQueryKeys.all, 'connection', connectionId] as const,
  connectionHealth: (connectionId: string) =>
    [...integrationsQueryKeys.all, 'connection-health', connectionId] as const,
  healthDashboard: () => [...integrationsQueryKeys.all, 'health-dashboard'] as const,
  syncLogs: (params: ListIntegrationsParams = {}) =>
    [...integrationsQueryKeys.all, 'sync-logs', params] as const,
  connectionSyncLogs: (connectionId: string, params: ListIntegrationsParams = {}) =>
    [...integrationsQueryKeys.all, 'connection-sync-logs', connectionId, params] as const,
  connectionSyncJobs: (connectionId: string, params: ListIntegrationsParams = {}) =>
    [...integrationsQueryKeys.all, 'connection-sync-jobs', connectionId, params] as const,
  connectionWebhooks: (connectionId: string, params: ListIntegrationsParams = {}) =>
    [...integrationsQueryKeys.all, 'connection-webhooks', connectionId, params] as const,
  webhookDeliveries: (params: ListIntegrationsParams = {}) =>
    [...integrationsQueryKeys.all, 'webhook-deliveries', params] as const,
};
