import { useQuery } from '@tanstack/react-query';
import { listDeals } from '@/features/sales/api/deals.api';
import type { ListDealsParams } from '@/features/sales/api/deal.types';

export const dealsQueryKeys = {
  all: ['deals'] as const,
  list: (params: ListDealsParams) => [...dealsQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...dealsQueryKeys.all, 'detail', id] as const,
};

/** TanStack Query hook for GET /deals. */
export function useDeals(params: ListDealsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dealsQueryKeys.list(params),
    queryFn: () => listDeals(params),
    enabled: options?.enabled ?? true,
  });
}
