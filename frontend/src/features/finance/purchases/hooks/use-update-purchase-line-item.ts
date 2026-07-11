import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePurchaseBillLineItem } from '@/features/finance/purchases/api/purchase-line-items.api';
import type { UpdatePurchaseBillLineItemPayload } from '@/features/finance/purchases/api/purchase-line-item.types';
import { invalidatePurchaseLineItemCaches } from '@/features/finance/purchases/hooks/purchase-line-items-query-keys';

interface UpdatePurchaseLineItemVariables {
  readonly lineItemId: string;
  readonly payload: UpdatePurchaseBillLineItemPayload;
}

/** TanStack Query mutation for PATCH /purchase-bills/:billId/items/:id. */
export function useUpdatePurchaseBillLineItem(billId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lineItemId, payload }: UpdatePurchaseLineItemVariables) =>
      updatePurchaseBillLineItem(billId, lineItemId, payload),
    onSuccess: async () => {
      await invalidatePurchaseLineItemCaches(queryClient, billId);
    },
  });
}
