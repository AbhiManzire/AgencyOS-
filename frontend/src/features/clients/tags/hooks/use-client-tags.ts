import { useQuery } from '@tanstack/react-query';
import { listClientTags } from '@/features/clients/tags/api/client-tags.api';
import { clientTagsQueryKeys } from '@/features/clients/tags/hooks/client-tags-query-keys';

/** TanStack Query hook for GET /clients/:clientId/tags. */
export function useClientTags(clientId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: clientTagsQueryKeys.list(clientId),
    queryFn: () => listClientTags(clientId),
    enabled: options?.enabled ?? clientId.length > 0,
  });
}
