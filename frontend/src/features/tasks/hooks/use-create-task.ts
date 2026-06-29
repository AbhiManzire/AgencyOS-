import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask } from '@/features/tasks/api/tasks.api';
import type { CreateTaskPayload } from '@/features/tasks/api/task-payload.types';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksQueryKeys.all });
    },
  });
}
