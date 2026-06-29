import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask } from '@/features/tasks/api/tasks.api';
import type { ListTasksParams, ListTasksResult } from '@/features/tasks/api/task.types';
import type { TaskStatus } from '@/features/tasks/types';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';

interface UpdateTaskStatusVariables {
  readonly taskId: string;
  readonly status: TaskStatus;
}

interface UpdateTaskStatusContext {
  readonly previous: ListTasksResult | undefined;
}

/** Updates task status with optimistic cache updates and rollback on failure. */
export function useUpdateTaskStatusOptimistic(listParams: ListTasksParams) {
  const queryClient = useQueryClient();
  const queryKey = tasksQueryKeys.list(listParams);

  return useMutation({
    mutationFn: ({ taskId, status }: UpdateTaskStatusVariables) => updateTask(taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<ListTasksResult>(queryKey);

      if (previous !== undefined) {
        queryClient.setQueryData<ListTasksResult>(queryKey, {
          ...previous,
          items: previous.items.map((task) => (task.id === taskId ? { ...task, status } : task)),
        });
      }

      return { previous } satisfies UpdateTaskStatusContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksQueryKeys.all });
    },
  });
}
