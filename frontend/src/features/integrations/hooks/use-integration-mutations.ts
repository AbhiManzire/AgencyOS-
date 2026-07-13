import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  connectIntegration,
  createConnectionWebhook,
  createIntegrationConnection,
  deleteConnectionWebhook,
  deleteIntegrationConnection,
  disconnectIntegration,
  syncIntegration,
  updateConnectionWebhook,
  updateIntegrationConnection,
} from '@/features/integrations/api/integrations.api';
import type {
  ConnectIntegrationPayload,
  CreateIntegrationConnectionPayload,
  CreateIntegrationWebhookPayload,
  SyncIntegrationPayload,
  UpdateIntegrationConnectionPayload,
  UpdateIntegrationWebhookPayload,
} from '@/features/integrations/api/integration.types';
import { integrationsQueryKeys } from '@/features/integrations/hooks/integrations-query-keys';

async function invalidateIntegrationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  connectionId?: string,
): Promise<void> {
  const tasks = [queryClient.invalidateQueries({ queryKey: integrationsQueryKeys.all })];
  if (connectionId) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: integrationsQueryKeys.connection(connectionId),
      }),
    );
  }
  await Promise.all(tasks);
}

export function useCreateIntegrationConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateIntegrationConnectionPayload) =>
      createIntegrationConnection(payload),
    onSuccess: async () => {
      await invalidateIntegrationQueries(queryClient);
    },
  });
}

export function useUpdateIntegrationConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      connectionId,
      payload,
    }: {
      readonly connectionId: string;
      readonly payload: UpdateIntegrationConnectionPayload;
    }) => updateIntegrationConnection(connectionId, payload),
    onSuccess: async (_data, variables) => {
      await invalidateIntegrationQueries(queryClient, variables.connectionId);
    },
  });
}

export function useDeleteIntegrationConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => deleteIntegrationConnection(connectionId),
    onSuccess: async () => {
      await invalidateIntegrationQueries(queryClient);
    },
  });
}

export function useConnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      connectionId,
      payload,
    }: {
      readonly connectionId: string;
      readonly payload: ConnectIntegrationPayload;
    }) => connectIntegration(connectionId, payload),
    onSuccess: async (_data, variables) => {
      await invalidateIntegrationQueries(queryClient, variables.connectionId);
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => disconnectIntegration(connectionId),
    onSuccess: async (_data, connectionId) => {
      await invalidateIntegrationQueries(queryClient, connectionId);
    },
  });
}

export function useSyncIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      connectionId,
      payload,
    }: {
      readonly connectionId: string;
      readonly payload?: SyncIntegrationPayload;
    }) => syncIntegration(connectionId, payload),
    onSuccess: async (_data, variables) => {
      await invalidateIntegrationQueries(queryClient, variables.connectionId);
    },
  });
}

export function useCreateConnectionWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      connectionId,
      payload,
    }: {
      readonly connectionId: string;
      readonly payload: CreateIntegrationWebhookPayload;
    }) => createConnectionWebhook(connectionId, payload),
    onSuccess: async (_data, variables) => {
      await invalidateIntegrationQueries(queryClient, variables.connectionId);
    },
  });
}

export function useUpdateConnectionWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      connectionId,
      webhookId,
      payload,
    }: {
      readonly connectionId: string;
      readonly webhookId: string;
      readonly payload: UpdateIntegrationWebhookPayload;
    }) => updateConnectionWebhook(connectionId, webhookId, payload),
    onSuccess: async (_data, variables) => {
      await invalidateIntegrationQueries(queryClient, variables.connectionId);
    },
  });
}

export function useDeleteConnectionWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      connectionId,
      webhookId,
    }: {
      readonly connectionId: string;
      readonly webhookId: string;
    }) => deleteConnectionWebhook(connectionId, webhookId),
    onSuccess: async (_data, variables) => {
      await invalidateIntegrationQueries(queryClient, variables.connectionId);
    },
  });
}
