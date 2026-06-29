import type { QueryClient } from '@tanstack/react-query';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';

export const clientContactsQueryKeys = {
  all: ['clientContacts'] as const,
  list: (clientId: string) => [...clientContactsQueryKeys.all, clientId] as const,
};

/** Invalidates client detail and contacts list caches for a client. */
export async function invalidateClientContactCaches(
  queryClient: QueryClient,
  clientId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: clientsQueryKeys.detail(clientId) }),
    queryClient.invalidateQueries({ queryKey: clientContactsQueryKeys.list(clientId) }),
  ]);
}
