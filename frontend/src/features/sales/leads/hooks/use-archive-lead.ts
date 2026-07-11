import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveLead } from '@/features/sales/leads/api/leads.api';
import { leadsQueryKeys } from '@/features/sales/leads/hooks/use-leads';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';

/** TanStack Query mutation for DELETE /leads/:id (archive). */
export function useArchiveLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveLead(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: leadsQueryKeys.detail(id) }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
