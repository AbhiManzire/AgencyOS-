import { useQuery } from '@tanstack/react-query';
import { getTask } from '@/features/tasks/api/tasks.api';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';

/** TanStack Query hook for GET /tasks/:id. */
export function useTask(id: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: tasksQueryKeys.detail(id),
    queryFn: () => getTask(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
