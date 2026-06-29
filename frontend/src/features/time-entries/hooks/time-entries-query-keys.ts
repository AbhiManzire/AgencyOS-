import type { QueryClient } from '@tanstack/react-query';

export const timeEntriesQueryKeys = {
  all: ['time-entries'] as const,
  task: (taskId: string) => [...timeEntriesQueryKeys.all, 'task', taskId] as const,
  active: () => [...timeEntriesQueryKeys.all, 'active'] as const,
};

export async function invalidateTaskTimeEntries(
  queryClient: QueryClient,
  taskId: string,
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: timeEntriesQueryKeys.task(taskId) });
}

export async function invalidateActiveTimeEntry(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: timeEntriesQueryKeys.active() });
}

export async function invalidateTimeEntryCaches(
  queryClient: QueryClient,
  taskId: string,
): Promise<void> {
  await Promise.all([
    invalidateTaskTimeEntries(queryClient, taskId),
    invalidateActiveTimeEntry(queryClient),
  ]);
}
