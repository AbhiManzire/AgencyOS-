import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { createPurchaseBill } from '@/features/finance/purchases/api/purchase-bills.api';
import type { CreatePurchaseBillPayload } from '@/features/finance/purchases/api/purchase-bill.types';
import { purchaseBillsQueryKeys } from '@/features/finance/purchases/hooks/use-purchase-bills';

/** TanStack Query mutation for POST /purchase-bills. */
export function useCreatePurchaseBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchaseBillPayload) => createPurchaseBill(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseBillsQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
