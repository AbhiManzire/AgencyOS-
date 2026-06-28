import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateClient } from '@/features/clients/api/clients.api';
import type { UpdateClientPayload } from '@/features/clients/api/client.types';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';

interface UpdateClientVariables {
  readonly id: string;
  readonly payload: UpdateClientPayload;
}

/** TanStack Query mutation hook for PATCH /clients/:id. */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateClientVariables) => updateClient(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: clientsQueryKeys.detail(variables.id) }),
      ]);
    },
  });
}
