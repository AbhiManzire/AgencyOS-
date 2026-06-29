import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFollowUp } from '@/features/sales/follow-ups/api/follow-ups.api';
import type { CreateFollowUpPayload } from '@/features/sales/follow-ups/api/follow-up.types';
import { invalidateDealFollowUpCaches } from '@/features/sales/follow-ups/hooks/follow-ups-query-keys';

export function useCreateDealFollowUp(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFollowUpPayload) => createFollowUp(dealId, payload),
    onSuccess: async () => {
      await invalidateDealFollowUpCaches(queryClient, dealId);
    },
  });
}
