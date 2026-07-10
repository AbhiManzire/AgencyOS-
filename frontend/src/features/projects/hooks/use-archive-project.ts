import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { archiveProject } from '@/features/projects/api/projects.api';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

/** TanStack Query mutation for POST /projects/:id/archive. */
export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveProject(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
