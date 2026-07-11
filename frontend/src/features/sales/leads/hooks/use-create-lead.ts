import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLead } from '@/features/sales/leads/api/leads.api';
import type { CreateLeadPayload } from '@/features/sales/leads/api/lead.types';
import { leadsQueryKeys } from '@/features/sales/leads/hooks/use-leads';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';

/** TanStack Query mutation for POST /leads. */
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => createLead(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
