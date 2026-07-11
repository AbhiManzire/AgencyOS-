import { useQuery } from '@tanstack/react-query';
import { listLeadTags } from '@/features/sales/leads/tags/api/lead-tags.api';
import { leadTagsQueryKeys } from '@/features/sales/leads/tags/hooks/lead-tags-query-keys';

/** TanStack Query hook for GET /leads/:leadId/tags. */
export function useLeadTags(leadId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: leadTagsQueryKeys.list(leadId),
    queryFn: () => listLeadTags(leadId),
    enabled: (options?.enabled ?? true) && leadId.length > 0,
  });
}
