import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteFollowUp } from '@/features/sales/follow-ups/api/follow-ups.api';
import { invalidateDealFollowUpCaches } from '@/features/sales/follow-ups/hooks/follow-ups-query-keys';

export function useDeleteDealFollowUp(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (followUpId: string) => deleteFollowUp(followUpId),
    onSuccess: async () => {
      await invalidateDealFollowUpCaches(queryClient, dealId);
    },
  });
}
