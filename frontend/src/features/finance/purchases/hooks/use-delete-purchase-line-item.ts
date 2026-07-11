import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePurchaseBillLineItem } from '@/features/finance/purchases/api/purchase-line-items.api';
import { invalidatePurchaseLineItemCaches } from '@/features/finance/purchases/hooks/purchase-line-items-query-keys';

/** TanStack Query mutation for DELETE /purchase-bills/:billId/items/:id. */
export function useDeletePurchaseBillLineItem(billId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lineItemId: string) => deletePurchaseBillLineItem(billId, lineItemId),
    onSuccess: async () => {
      await invalidatePurchaseLineItemCaches(queryClient, billId);
    },
  });
}
