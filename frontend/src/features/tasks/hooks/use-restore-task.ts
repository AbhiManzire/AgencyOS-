import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { invalidateProjectProgress } from '@/features/projects/hooks/invalidate-project-progress';
import { restoreTask } from '@/features/tasks/api/tasks.api';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';

/** TanStack Query mutation for POST /tasks/:id/restore. */
export function useRestoreTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreTask(id),
    onSuccess: async (task) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tasksQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: tasksQueryKeys.detail(task.id) }),
        invalidateProjectProgress(queryClient, task.projectId),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
