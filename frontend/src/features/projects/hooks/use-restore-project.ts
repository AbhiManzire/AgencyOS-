import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { restoreProject } from '@/features/projects/api/projects.api';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

/** TanStack Query mutation for POST /projects/:id/restore. */
export function useRestoreProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreProject(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(id) }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
