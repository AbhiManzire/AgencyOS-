import { useMutation, useQueryClient } from '@tanstack/react-query';
import { convertLead } from '@/features/sales/leads/api/leads.api';
import { leadsQueryKeys } from '@/features/sales/leads/hooks/use-leads';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';

/** TanStack Query mutation for POST /leads/:id/convert. */
export function useConvertLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => convertLead(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: leadsQueryKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
