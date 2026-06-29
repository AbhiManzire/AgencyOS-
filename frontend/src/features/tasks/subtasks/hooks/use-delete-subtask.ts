import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSubtask } from '@/features/tasks/subtasks/api/subtasks.api';
import { taskSubtasksQueryKeys } from '@/features/tasks/subtasks/hooks/task-subtasks-query-keys';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';

export function useDeleteSubtask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subtaskId: string) => deleteSubtask(taskId, subtaskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskSubtasksQueryKeys.all(taskId) });
      await queryClient.invalidateQueries({ queryKey: tasksQueryKeys.detail(taskId) });
    },
  });
}
