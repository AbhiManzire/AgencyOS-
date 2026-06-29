import { useQuery } from '@tanstack/react-query';
import { getDeal } from '@/features/sales/api/deals.api';
import { dealsQueryKeys } from '@/features/sales/hooks/use-deals';

/** TanStack Query hook for GET /deals/:id. */
export function useDeal(id: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: dealsQueryKeys.detail(id),
    queryFn: () => getDeal(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
