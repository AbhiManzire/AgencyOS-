import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unassignLeadTag } from '@/features/sales/leads/tags/api/lead-tags.api';
import { leadTagsQueryKeys } from '@/features/sales/leads/tags/hooks/lead-tags-query-keys';

/** TanStack Query mutation for DELETE /leads/:leadId/tags/:tagId. */
export function useUnassignLeadTag(leadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => unassignLeadTag(leadId, tagId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadTagsQueryKeys.list(leadId) });
    },
  });
}
