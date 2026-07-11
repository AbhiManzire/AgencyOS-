import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLead } from '@/features/sales/leads/api/leads.api';
import type { UpdateLeadPayload } from '@/features/sales/leads/api/lead.types';
import { leadsQueryKeys } from '@/features/sales/leads/hooks/use-leads';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';

/** TanStack Query mutation for PATCH /leads/:id. */
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLeadPayload }) =>
      updateLead(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: leadsQueryKeys.detail(variables.id) }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
