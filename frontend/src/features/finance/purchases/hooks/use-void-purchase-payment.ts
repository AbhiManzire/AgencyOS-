import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { voidPurchasePayment } from '@/features/finance/purchases/api/purchase-payments.api';
import { purchasePaymentsQueryKeys } from '@/features/finance/purchases/hooks/purchase-payments-query-keys';
import { purchaseBillsQueryKeys } from '@/features/finance/purchases/hooks/use-purchase-bills';

/** TanStack Query mutation for POST /purchase-payments/:id/void. */
export function useVoidPurchasePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => voidPurchasePayment(paymentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: purchasePaymentsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: purchaseBillsQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
