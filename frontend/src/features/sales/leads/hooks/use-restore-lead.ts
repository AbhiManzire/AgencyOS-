import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restoreLead } from '@/features/sales/leads/api/leads.api';
import type { RestoreLeadPayload } from '@/features/sales/leads/api/lead.types';
import { leadsQueryKeys } from '@/features/sales/leads/hooks/use-leads';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';

/** TanStack Query mutation for POST /leads/:id/restore. */
export function useRestoreLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: RestoreLeadPayload }) =>
      restoreLead(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: leadsQueryKeys.detail(variables.id) }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
