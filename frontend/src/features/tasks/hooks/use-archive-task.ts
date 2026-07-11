import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { archiveTask } from '@/features/tasks/api/tasks.api';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';
import { invalidateProjectProgress } from '@/features/projects/hooks/invalidate-project-progress';

/** TanStack Query mutation for DELETE /tasks/:id (archive). */
export function useArchiveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveTask(id),
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
