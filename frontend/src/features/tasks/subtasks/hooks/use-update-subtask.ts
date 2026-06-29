import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateSubtaskPayload } from '@/features/tasks/subtasks/api/subtask.types';
import { updateSubtask } from '@/features/tasks/subtasks/api/subtasks.api';
import { taskSubtasksQueryKeys } from '@/features/tasks/subtasks/hooks/task-subtasks-query-keys';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';

interface UpdateSubtaskVariables {
  readonly subtaskId: string;
  readonly payload: UpdateSubtaskPayload;
}

export function useUpdateSubtask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subtaskId, payload }: UpdateSubtaskVariables) =>
      updateSubtask(taskId, subtaskId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskSubtasksQueryKeys.all(taskId) });
      await queryClient.invalidateQueries({ queryKey: tasksQueryKeys.detail(taskId) });
    },
  });
}
