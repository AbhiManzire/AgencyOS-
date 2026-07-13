import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignDealTag, unassignDealTag } from '@/features/sales/deals/tags/api/deal-tags.api';
import type { AssignDealTagPayload } from '@/features/sales/deals/tags/api/deal-tag.types';
import { dealTagsQueryKeys } from '@/features/sales/deals/tags/hooks/deal-tags-query-keys';

export function useAssignDealTag(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignDealTagPayload) => assignDealTag(dealId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dealTagsQueryKeys.list(dealId) });
    },
  });
}

export function useUnassignDealTag(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => unassignDealTag(dealId, tagId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dealTagsQueryKeys.list(dealId) });
    },
  });
}
