import { useQuery } from '@tanstack/react-query';
import { getPurchaseBill } from '@/features/finance/purchases/api/purchase-bills.api';
import { purchaseBillsQueryKeys } from '@/features/finance/purchases/hooks/use-purchase-bills';

/** TanStack Query hook for GET /purchase-bills/:id. */
export function usePurchaseBill(id: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: purchaseBillsQueryKeys.detail(id),
    queryFn: () => getPurchaseBill(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
