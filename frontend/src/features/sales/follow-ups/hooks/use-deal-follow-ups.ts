import { useQuery } from '@tanstack/react-query';
import { followUpRecordToListItem } from '@/features/sales/follow-ups/api/follow-up.mapper';
import { listFollowUps } from '@/features/sales/follow-ups/api/follow-ups.api';
import { followUpsQueryKeys } from '@/features/sales/follow-ups/hooks/follow-ups-query-keys';

/** TanStack Query hook for GET /deals/:dealId/followups. */
export function useDealFollowUps(dealId: string) {
  return useQuery({
    queryKey: followUpsQueryKeys.list(dealId),
    queryFn: async () => {
      const records = await listFollowUps(dealId);
      return records.map(followUpRecordToListItem);
    },
    enabled: dealId.length > 0,
  });
}
