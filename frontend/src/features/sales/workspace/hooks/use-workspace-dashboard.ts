import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { getWorkspaceDashboard } from '@/features/sales/workspace/api/workspace.api';
import { workspaceQueryKeys } from '@/features/sales/workspace/hooks/workspace-query-keys';

export async function invalidateWorkspaceCaches(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['sales-tasks'] }),
  ]);
}

/** TanStack Query hook for GET /sales-workspace/dashboard. */
export function useWorkspaceDashboard(options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: workspaceQueryKeys.dashboard(),
    queryFn: () => getWorkspaceDashboard(),
    enabled: options?.enabled ?? true,
  });
}

export function useInvalidateWorkspace() {
  const queryClient = useQueryClient();
  return () => invalidateWorkspaceCaches(queryClient);
}
