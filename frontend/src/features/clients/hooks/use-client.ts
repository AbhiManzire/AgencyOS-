import { useQuery } from '@tanstack/react-query';
import { getClient } from '@/features/clients/api/clients.api';
import type { GetClientParams } from '@/features/clients/api/client.types';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';

/** TanStack Query hook for GET /clients/:id. */
export function useClient(id: string, options?: { readonly enabled?: boolean } & GetClientParams) {
  const includeArchived = options?.includeArchived;

  return useQuery({
    queryKey: [...clientsQueryKeys.detail(id), { includeArchived }] as const,
    queryFn: () => getClient(id, { includeArchived }),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
