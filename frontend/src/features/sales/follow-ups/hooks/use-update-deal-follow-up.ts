import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateFollowUp } from '@/features/sales/follow-ups/api/follow-ups.api';
import type { UpdateFollowUpPayload } from '@/features/sales/follow-ups/api/follow-up.types';
import { invalidateDealFollowUpCaches } from '@/features/sales/follow-ups/hooks/follow-ups-query-keys';

interface UpdateDealFollowUpVariables {
  readonly followUpId: string;
  readonly payload: UpdateFollowUpPayload;
}

export function useUpdateDealFollowUp(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ followUpId, payload }: UpdateDealFollowUpVariables) =>
      updateFollowUp(followUpId, payload),
    onSuccess: async () => {
      await invalidateDealFollowUpCaches(queryClient, dealId);
    },
  });
}
