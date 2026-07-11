import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { invalidateProjectProgress } from '@/features/projects/hooks/invalidate-project-progress';
import { updateTask } from '@/features/tasks/api/tasks.api';
import type { ListTasksParams, ListTasksResult } from '@/features/tasks/api/task.types';
import type { TaskStatus } from '@/features/tasks/types';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';

interface UpdateTaskBoardVariables {
  readonly taskId: string;
  readonly status: TaskStatus;
  readonly boardOrder: number;
}

interface UpdateTaskBoardContext {
  readonly previous: ListTasksResult | undefined;
}

/** Updates task status/boardOrder with optimistic cache updates and rollback on failure. */
export function useUpdateTaskStatusOptimistic(listParams: ListTasksParams) {
  const queryClient = useQueryClient();
  const queryKey = tasksQueryKeys.list(listParams);

  return useMutation({
    mutationFn: ({ taskId, status, boardOrder }: UpdateTaskBoardVariables) =>
      updateTask(taskId, { status, boardOrder }),
    onMutate: async ({ taskId, status, boardOrder }) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<ListTasksResult>(queryKey);

      if (previous !== undefined) {
        queryClient.setQueryData<ListTasksResult>(queryKey, {
          ...previous,
          items: previous.items.map((task) =>
            task.id === taskId ? { ...task, status, boardOrder } : task,
          ),
        });
      }

      return { previous } satisfies UpdateTaskBoardContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: async (_data, _error, variables) => {
      const cached = queryClient.getQueryData<ListTasksResult>(queryKey);
      const projectId =
        cached?.items.find((task) => task.id === variables.taskId)?.projectId ??
        listParams.projectId ??
        '';

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tasksQueryKeys.all }),
        invalidateProjectProgress(queryClient, projectId),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
