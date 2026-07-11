import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { updatePurchaseBill } from '@/features/finance/purchases/api/purchase-bills.api';
import type { UpdatePurchaseBillPayload } from '@/features/finance/purchases/api/purchase-bill.types';
import { purchasePaymentsQueryKeys } from '@/features/finance/purchases/hooks/purchase-payments-query-keys';
import { purchaseBillsQueryKeys } from '@/features/finance/purchases/hooks/use-purchase-bills';

interface UpdatePurchaseBillVariables {
  readonly id: string;
  readonly payload: UpdatePurchaseBillPayload;
}

/** TanStack Query mutation for PATCH /purchase-bills/:id. */
export function useUpdatePurchaseBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdatePurchaseBillVariables) => updatePurchaseBill(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseBillsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: purchasePaymentsQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
