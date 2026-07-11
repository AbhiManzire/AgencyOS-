import { useQuery } from '@tanstack/react-query';
import {
  getPurchasePayment,
  listPurchaseBillPayments,
} from '@/features/finance/purchases/api/purchase-payments.api';
import { purchasePaymentsQueryKeys } from '@/features/finance/purchases/hooks/purchase-payments-query-keys';

/** TanStack Query hook for GET /purchase-bills/:billId/payments. */
export function usePurchaseBillPayments(billId: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: purchasePaymentsQueryKeys.bill(billId),
    queryFn: () => listPurchaseBillPayments(billId),
    enabled: (options?.enabled ?? true) && billId.length > 0,
  });
}

/** TanStack Query hook for GET /purchase-payments/:id. */
export function usePurchasePayment(id: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: purchasePaymentsQueryKeys.detail(id),
    queryFn: () => getPurchasePayment(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
