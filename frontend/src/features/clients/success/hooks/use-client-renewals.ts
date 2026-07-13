import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createClientRenewal,
  deleteClientRenewal,
  listClientRenewals,
  updateClientRenewal,
} from '@/features/clients/success/api/client-renewals.api';
import type {
  CreateClientRenewalPayload,
  ListClientRenewalsParams,
  UpdateClientRenewalPayload,
} from '@/features/clients/success/api/client-renewals.types';
import { clientSuccessQueryKeys } from '@/features/clients/success/hooks/client-success-query-keys';

async function invalidateClientRenewals(queryClient: QueryClient, clientId: string): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: clientSuccessQueryKeys.renewals(clientId) }),
    queryClient.invalidateQueries({ queryKey: clientSuccessQueryKeys.workspace(clientId) }),
    queryClient.invalidateQueries({ queryKey: clientSuccessQueryKeys.metrics(clientId) }),
    queryClient.invalidateQueries({ queryKey: clientSuccessQueryKeys.dashboard() }),
  ]);
}

/** TanStack Query hook for GET /clients/:clientId/renewals. */
export function useClientRenewals(
  clientId: string,
  params: ListClientRenewalsParams = {},
  options?: { readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: clientSuccessQueryKeys.renewals(clientId, params),
    queryFn: () => listClientRenewals(clientId, params),
    enabled: (options?.enabled ?? true) && clientId.length > 0,
  });
}

/** Creates a client renewal. */
export function useCreateClientRenewal(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClientRenewalPayload) => createClientRenewal(clientId, payload),
    onSuccess: async () => {
      await invalidateClientRenewals(queryClient, clientId);
    },
  });
}

/** Updates a client renewal. */
export function useUpdateClientRenewal(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      renewalId,
      payload,
    }: {
      renewalId: string;
      payload: UpdateClientRenewalPayload;
    }) => updateClientRenewal(clientId, renewalId, payload),
    onSuccess: async () => {
      await invalidateClientRenewals(queryClient, clientId);
    },
  });
}

/** Deletes a client renewal. */
export function useDeleteClientRenewal(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renewalId: string) => deleteClientRenewal(clientId, renewalId),
    onSuccess: async () => {
      await invalidateClientRenewals(queryClient, clientId);
    },
  });
}
