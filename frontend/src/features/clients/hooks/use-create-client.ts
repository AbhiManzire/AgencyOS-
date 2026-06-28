import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/features/clients/api/clients.api';
import type { CreateClientPayload } from '@/features/clients/api/client.types';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';

/** TanStack Query mutation hook for POST /clients. */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClientPayload) => createClient(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });
    },
  });
}
