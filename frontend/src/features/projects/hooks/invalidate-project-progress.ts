import type { QueryClient } from '@tanstack/react-query';

/** Invalidates project progress aggregates derived from tasks/milestones. */
export async function invalidateProjectProgress(
  queryClient: QueryClient,
  projectId: string,
): Promise<void> {
  if (projectId.length === 0) {
    return;
  }

  await queryClient.invalidateQueries({
    queryKey: ['projects', projectId, 'progress'],
  });
}
