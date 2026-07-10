import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/features/clients/api/clients.api';
import type { CreateClientPayload } from '@/features/clients/api/client.types';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';

/** TanStack Query mutation hook for POST /clients. */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClientPayload) => createClient(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
