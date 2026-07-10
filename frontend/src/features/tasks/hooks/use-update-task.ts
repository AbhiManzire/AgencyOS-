import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { invalidateProjectProgress } from '@/features/projects/hooks/invalidate-project-progress';
import { updateTask } from '@/features/tasks/api/tasks.api';
import type { UpdateTaskPayload } from '@/features/tasks/api/task-payload.types';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskPayload }) =>
      updateTask(taskId, payload),
    onSuccess: async (task, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tasksQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: tasksQueryKeys.detail(variables.taskId) }),
        invalidateProjectProgress(queryClient, task.projectId),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
