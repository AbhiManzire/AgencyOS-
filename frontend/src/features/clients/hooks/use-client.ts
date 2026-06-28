import { useQuery } from '@tanstack/react-query';
import { getClient } from '@/features/clients/api/clients.api';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';

/** TanStack Query hook for GET /clients/:id. */
export function useClient(id: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: clientsQueryKeys.detail(id),
    queryFn: () => getClient(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
