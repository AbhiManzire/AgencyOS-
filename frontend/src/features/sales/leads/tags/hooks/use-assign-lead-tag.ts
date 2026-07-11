import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignLeadTag } from '@/features/sales/leads/tags/api/lead-tags.api';
import type { AssignLeadTagPayload } from '@/features/sales/leads/tags/api/lead-tag.types';
import { leadTagsQueryKeys } from '@/features/sales/leads/tags/hooks/lead-tags-query-keys';

/** TanStack Query mutation for POST /leads/:leadId/tags. */
export function useAssignLeadTag(leadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignLeadTagPayload) => assignLeadTag(leadId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadTagsQueryKeys.list(leadId) });
    },
  });
}
