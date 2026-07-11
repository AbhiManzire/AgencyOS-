import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { createPurchaseBillPayment } from '@/features/finance/purchases/api/purchase-payments.api';
import type { CreatePurchasePaymentPayload } from '@/features/finance/purchases/api/purchase-payment.types';
import { purchasePaymentsQueryKeys } from '@/features/finance/purchases/hooks/purchase-payments-query-keys';
import { purchaseBillsQueryKeys } from '@/features/finance/purchases/hooks/use-purchase-bills';

/** TanStack Query mutation for POST /purchase-bills/:billId/payments. */
export function useCreatePurchaseBillPayment(billId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchasePaymentPayload) =>
      createPurchaseBillPayment(billId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: purchasePaymentsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: purchaseBillsQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
