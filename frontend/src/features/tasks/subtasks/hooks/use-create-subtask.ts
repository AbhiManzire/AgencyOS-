import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateSubtaskPayload } from '@/features/tasks/subtasks/api/subtask.types';
import { createSubtask } from '@/features/tasks/subtasks/api/subtasks.api';
import { taskSubtasksQueryKeys } from '@/features/tasks/subtasks/hooks/task-subtasks-query-keys';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';

export function useCreateSubtask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSubtaskPayload) => createSubtask(taskId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskSubtasksQueryKeys.all(taskId) });
      await queryClient.invalidateQueries({ queryKey: tasksQueryKeys.detail(taskId) });
    },
  });
}
