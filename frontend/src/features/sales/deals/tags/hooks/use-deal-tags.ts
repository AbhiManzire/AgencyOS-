import { useQuery } from '@tanstack/react-query';
import { listDealTags } from '@/features/sales/deals/tags/api/deal-tags.api';
import { dealTagsQueryKeys } from '@/features/sales/deals/tags/hooks/deal-tags-query-keys';

/** TanStack Query hook for GET /deals/:dealId/tags. */
export function useDealTags(dealId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dealTagsQueryKeys.list(dealId),
    queryFn: () => listDealTags(dealId),
    enabled: (options?.enabled ?? true) && dealId.length > 0,
  });
}
