import { useQuery } from '@tanstack/react-query';
import { getWorkspaceQueue } from '@/features/sales/workspace/api/workspace.api';
import type { ListWorkspaceQueueParams } from '@/features/sales/workspace/api/workspace.types';
import { workspaceQueryKeys } from '@/features/sales/workspace/hooks/workspace-query-keys';

/** TanStack Query hook for GET /sales-workspace/queue. */
export function useWorkspaceQueue(
  params: ListWorkspaceQueueParams = {},
  options?: { readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: workspaceQueryKeys.queue(params),
    queryFn: () => getWorkspaceQueue(params),
    enabled: options?.enabled ?? true,
  });
}
