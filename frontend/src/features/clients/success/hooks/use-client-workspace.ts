import { useQuery } from '@tanstack/react-query';
import { getClientWorkspace } from '@/features/clients/success/api/client-success.api';
import { clientSuccessQueryKeys } from '@/features/clients/success/hooks/client-success-query-keys';

/** TanStack Query hook for GET /clients/:id/workspace. */
export function useClientWorkspace(clientId: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: clientSuccessQueryKeys.workspace(clientId),
    queryFn: () => getClientWorkspace(clientId),
    enabled: (options?.enabled ?? true) && clientId.length > 0,
  });
}
