import { useQuery } from '@tanstack/react-query';
import { purchaseBillRecordToListItem } from '@/features/finance/purchases/api/purchase-bill.mapper';
import { listPurchaseBills } from '@/features/finance/purchases/api/purchase-bills.api';
import type { ListPurchaseBillsParams } from '@/features/finance/purchases/api/purchase-bill.types';
import { listVendors } from '@/features/finance/vendors/api/vendors.api';

export const purchaseBillsQueryKeys = {
  all: ['purchaseBills'] as const,
  list: (params: ListPurchaseBillsParams) =>
    [...purchaseBillsQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...purchaseBillsQueryKeys.all, 'detail', id] as const,
};

/** TanStack Query hook for GET /purchase-bills with vendor names resolved. */
export function usePurchaseBills(
  params: ListPurchaseBillsParams = {},
  options?: { readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: purchaseBillsQueryKeys.list(params),
    queryFn: async () => {
      const [billsResult, vendorsResult] = await Promise.all([
        listPurchaseBills(params),
        listVendors({ take: 100 }),
      ]);

      const vendorNameById = new Map(
        vendorsResult.items.map((vendor) => [vendor.id, vendor.name] as const),
      );

      return {
        ...billsResult,
        items: billsResult.items.map((bill) =>
          purchaseBillRecordToListItem(bill, vendorNameById.get(bill.vendorId) ?? ''),
        ),
      };
    },
    enabled: options?.enabled ?? true,
  });
}
