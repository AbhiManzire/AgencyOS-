import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPurchaseBillLineItem } from '@/features/finance/purchases/api/purchase-line-items.api';
import type { CreatePurchaseBillLineItemPayload } from '@/features/finance/purchases/api/purchase-line-item.types';
import { invalidatePurchaseLineItemCaches } from '@/features/finance/purchases/hooks/purchase-line-items-query-keys';

/** TanStack Query mutation for POST /purchase-bills/:billId/items. */
export function useCreatePurchaseBillLineItem(billId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchaseBillLineItemPayload) =>
      createPurchaseBillLineItem(billId, payload),
    onSuccess: async () => {
      await invalidatePurchaseLineItemCaches(queryClient, billId);
    },
  });
}
