import { useQuery } from '@tanstack/react-query';
import { listWorkspaceOwners } from '@/features/clients/api/clients.api';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';

export const workspaceOwnersQueryKeys = {
  all: [...clientsQueryKeys.all, 'workspace-owners'] as const,
};

/** TanStack Query hook for GET /clients/workspace-owners. */
export function useWorkspaceOwners(options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: workspaceOwnersQueryKeys.all,
    queryFn: () => listWorkspaceOwners(),
    enabled: options?.enabled ?? true,
  });
}
