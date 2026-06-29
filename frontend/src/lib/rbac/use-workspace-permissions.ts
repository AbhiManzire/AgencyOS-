import { useQuery } from '@tanstack/react-query';
import { fetchMyPermissions } from '@/lib/rbac/permissions.api';

export const permissionsQueryKeys = {
  all: ['permissions'] as const,
  me: () => [...permissionsQueryKeys.all, 'me'] as const,
};

/** TanStack Query hook for GET /rbac/me/permissions. */
export function useWorkspacePermissionsQuery() {
  return useQuery({
    queryKey: permissionsQueryKeys.me(),
    queryFn: fetchMyPermissions,
    staleTime: 60_000,
  });
}
