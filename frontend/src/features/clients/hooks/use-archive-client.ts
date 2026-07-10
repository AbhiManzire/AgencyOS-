import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveClient } from '@/features/clients/api/clients.api';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';

/** TanStack Query mutation hook for POST /clients/:id/archive. */
export function useArchiveClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveClient(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: clientsQueryKeys.detail(id) }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
