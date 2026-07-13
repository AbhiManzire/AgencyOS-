import { useQuery } from '@tanstack/react-query';
import {
  getIntegrationConnection,
  getIntegrationConnectionHealth,
  getIntegrationHealthDashboard,
  listConnectionSyncJobs,
  listConnectionSyncLogs,
  listConnectionWebhooks,
  listIntegrationCatalog,
  listIntegrationConnections,
  listIntegrationSyncLogs,
  listWebhookDeliveries,
} from '@/features/integrations/api/integrations.api';
import type { ListIntegrationsParams } from '@/features/integrations/api/integration.types';
import { integrationsQueryKeys } from '@/features/integrations/hooks/integrations-query-keys';

export function useIntegrationCatalog(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: integrationsQueryKeys.catalog(),
    queryFn: () => listIntegrationCatalog(),
    enabled: options?.enabled ?? true,
  });
}

export function useIntegrationConnections(
  params: ListIntegrationsParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: integrationsQueryKeys.connections(params),
    queryFn: () => listIntegrationConnections(params),
    enabled: options?.enabled ?? true,
  });
}

export function useIntegrationConnection(connectionId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: integrationsQueryKeys.connection(connectionId),
    queryFn: () => getIntegrationConnection(connectionId),
    enabled: (options?.enabled ?? true) && connectionId.length > 0,
  });
}

export function useIntegrationConnectionHealth(
  connectionId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: integrationsQueryKeys.connectionHealth(connectionId),
    queryFn: () => getIntegrationConnectionHealth(connectionId),
    enabled: (options?.enabled ?? true) && connectionId.length > 0,
  });
}

export function useIntegrationHealthDashboard(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: integrationsQueryKeys.healthDashboard(),
    queryFn: () => getIntegrationHealthDashboard(),
    enabled: options?.enabled ?? true,
  });
}

export function useIntegrationSyncLogs(
  params: ListIntegrationsParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: integrationsQueryKeys.syncLogs(params),
    queryFn: () => listIntegrationSyncLogs(params),
    enabled: options?.enabled ?? true,
  });
}

export function useConnectionSyncLogs(
  connectionId: string,
  params: ListIntegrationsParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: integrationsQueryKeys.connectionSyncLogs(connectionId, params),
    queryFn: () => listConnectionSyncLogs(connectionId, params),
    enabled: (options?.enabled ?? true) && connectionId.length > 0,
  });
}

export function useConnectionSyncJobs(
  connectionId: string,
  params: ListIntegrationsParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: integrationsQueryKeys.connectionSyncJobs(connectionId, params),
    queryFn: () => listConnectionSyncJobs(connectionId, params),
    enabled: (options?.enabled ?? true) && connectionId.length > 0,
  });
}

export function useConnectionWebhooks(
  connectionId: string,
  params: ListIntegrationsParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: integrationsQueryKeys.connectionWebhooks(connectionId, params),
    queryFn: () => listConnectionWebhooks(connectionId, params),
    enabled: (options?.enabled ?? true) && connectionId.length > 0,
  });
}

export function useWebhookDeliveries(
  params: ListIntegrationsParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: integrationsQueryKeys.webhookDeliveries(params),
    queryFn: () => listWebhookDeliveries(params),
    enabled: options?.enabled ?? true,
  });
}
