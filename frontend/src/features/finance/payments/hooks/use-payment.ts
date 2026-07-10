import { useQuery } from '@tanstack/react-query';
import { getPayment } from '@/features/finance/payments/api/payments.api';
import { paymentsQueryKeys } from '@/features/finance/payments/hooks/payments-query-keys';

export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: paymentsQueryKeys.detail(paymentId),
    queryFn: () => getPayment(paymentId),
    enabled: paymentId.length > 0,
  });
}
