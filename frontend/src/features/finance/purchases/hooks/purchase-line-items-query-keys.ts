import type { QueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { purchasePaymentsQueryKeys } from '@/features/finance/purchases/hooks/purchase-payments-query-keys';
import { purchaseBillsQueryKeys } from '@/features/finance/purchases/hooks/use-purchase-bills';

export const purchaseLineItemsQueryKeys = {
  all: ['purchaseLineItems'] as const,
  list: (billId: string) => [...purchaseLineItemsQueryKeys.all, billId] as const,
};

export async function invalidatePurchaseLineItemCaches(
  queryClient: QueryClient,
  billId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: purchaseLineItemsQueryKeys.list(billId) }),
    queryClient.invalidateQueries({ queryKey: purchaseBillsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: purchasePaymentsQueryKeys.all }),
    invalidateDashboardSummary(queryClient),
  ]);
}
