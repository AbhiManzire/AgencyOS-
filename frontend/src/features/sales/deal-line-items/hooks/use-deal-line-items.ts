import { useQuery } from '@tanstack/react-query';
import { listDealLineItems } from '@/features/sales/deal-line-items/api/deal-line-items.api';
import { dealLineItemsQueryKeys } from '@/features/sales/deal-line-items/hooks/deal-line-items-query-keys';

/** TanStack Query hook for GET /deals/:dealId/line-items. */
export function useDealLineItems(dealId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dealLineItemsQueryKeys.list(dealId),
    queryFn: () => listDealLineItems(dealId),
    enabled: (options?.enabled ?? true) && dealId.length > 0,
  });
}
