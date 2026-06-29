import { useQuery } from '@tanstack/react-query';
import { listTasks } from '@/features/tasks/api/tasks.api';
import type { ListTasksParams } from '@/features/tasks/api/task.types';

export const tasksQueryKeys = {
  all: ['tasks'] as const,
  list: (params: ListTasksParams) => [...tasksQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...tasksQueryKeys.all, 'detail', id] as const,
};

/** TanStack Query hook for GET /tasks with pagination and filters. */
export function useTasks(params: ListTasksParams) {
  return useQuery({
    queryKey: tasksQueryKeys.list(params),
    queryFn: () => listTasks(params),
  });
}
