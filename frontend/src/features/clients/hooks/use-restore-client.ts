import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restoreClient } from '@/features/clients/api/clients.api';
import type { RestoreClientPayload } from '@/features/clients/api/client.types';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';

interface RestoreClientVariables {
  readonly id: string;
  readonly payload?: RestoreClientPayload;
}

/** TanStack Query mutation hook for POST /clients/:id/restore. */
export function useRestoreClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: RestoreClientVariables) => restoreClient(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: clientsQueryKeys.detail(variables.id) }),
      ]);
    },
  });
}
