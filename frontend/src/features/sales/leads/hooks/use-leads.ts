import { useQuery } from '@tanstack/react-query';
import { listLeads } from '@/features/sales/leads/api/leads.api';
import type { ListLeadsParams } from '@/features/sales/leads/api/lead.types';

export const leadsQueryKeys = {
  all: ['leads'] as const,
  list: (params: ListLeadsParams) => [...leadsQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...leadsQueryKeys.all, 'detail', id] as const,
};

/** TanStack Query hook for GET /leads. */
export function useLeads(params: ListLeadsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: leadsQueryKeys.list(params),
    queryFn: () => listLeads(params),
    enabled: options?.enabled ?? true,
  });
}
