import { useQuery } from '@tanstack/react-query';
import { listClients } from '@/features/clients/api/clients.api';
import type { ListClientsParams } from '@/features/clients/api/client.types';

export const clientsQueryKeys = {
  all: ['clients'] as const,
  list: (params: ListClientsParams) => [...clientsQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...clientsQueryKeys.all, 'detail', id] as const,
};

/** TanStack Query hook for GET /clients with pagination and status filter. */
export function useClients(params: ListClientsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: clientsQueryKeys.list(params),
    queryFn: () => listClients(params),
    enabled: options?.enabled ?? true,
  });
}
