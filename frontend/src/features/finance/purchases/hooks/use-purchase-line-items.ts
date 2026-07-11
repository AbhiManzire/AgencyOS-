import { useQuery } from '@tanstack/react-query';
import { purchaseLineItemRecordToListItem } from '@/features/finance/purchases/api/purchase-line-item.mapper';
import { listPurchaseBillLineItems } from '@/features/finance/purchases/api/purchase-line-items.api';
import { purchaseLineItemsQueryKeys } from '@/features/finance/purchases/hooks/purchase-line-items-query-keys';

/** TanStack Query hook for GET /purchase-bills/:billId/items. */
export function usePurchaseBillLineItems(billId: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: purchaseLineItemsQueryKeys.list(billId),
    queryFn: async () => {
      const items = await listPurchaseBillLineItems(billId);
      return items.map(purchaseLineItemRecordToListItem);
    },
    enabled: (options?.enabled ?? true) && billId.length > 0,
  });
}
