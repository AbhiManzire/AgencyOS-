import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { archivePurchaseBill } from '@/features/finance/purchases/api/purchase-bills.api';
import { purchaseBillsQueryKeys } from '@/features/finance/purchases/hooks/use-purchase-bills';

/** TanStack Query mutation for DELETE /purchase-bills/:id. */
export function useArchivePurchaseBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archivePurchaseBill(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseBillsQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
