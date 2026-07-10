import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { markProjectInvoiceReady } from '@/features/projects/api/projects.api';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

/** TanStack Query mutation for POST /projects/:id/invoice-ready. */
export function useMarkProjectInvoiceReady() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markProjectInvoiceReady(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(id) }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
