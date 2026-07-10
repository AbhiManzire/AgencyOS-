import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { invalidateProjectProgress } from '@/features/projects/hooks/invalidate-project-progress';
import { createTask } from '@/features/tasks/api/tasks.api';
import type { CreateTaskPayload } from '@/features/tasks/api/task-payload.types';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: async (task) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tasksQueryKeys.all }),
        invalidateProjectProgress(queryClient, task.projectId),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
