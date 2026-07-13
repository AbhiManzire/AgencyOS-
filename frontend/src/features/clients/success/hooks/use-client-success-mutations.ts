import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  convertClientFromDeal,
  mergeClients,
  refreshClientHealth,
} from '@/features/clients/success/api/client-success.api';
import type {
  ConvertFromDealPayload,
  MergeClientsPayload,
} from '@/features/clients/success/api/client-success.types';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';
import { clientSuccessQueryKeys } from '@/features/clients/success/hooks/client-success-query-keys';

/** Activates a client from a won deal. */
export function useConvertClientFromDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConvertFromDealPayload) => convertClientFromDeal(payload),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: clientSuccessQueryKeys.workspace(result.client.id),
        }),
        queryClient.invalidateQueries({
          queryKey: clientSuccessQueryKeys.metrics(result.client.id),
        }),
        queryClient.invalidateQueries({ queryKey: clientSuccessQueryKeys.dashboard() }),
      ]);
    },
  });
}

/** Merges source client into target client. */
export function useMergeClients() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MergeClientsPayload) => mergeClients(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: clientSuccessQueryKeys.all }),
      ]);
    },
  });
}

/** Recalculates and persists client health. */
export function useRefreshClientHealth(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refreshClientHealth(clientId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientSuccessQueryKeys.health(clientId) }),
        queryClient.invalidateQueries({ queryKey: clientSuccessQueryKeys.metrics(clientId) }),
        queryClient.invalidateQueries({ queryKey: clientSuccessQueryKeys.workspace(clientId) }),
        queryClient.invalidateQueries({ queryKey: clientSuccessQueryKeys.dashboard() }),
      ]);
    },
  });
}
