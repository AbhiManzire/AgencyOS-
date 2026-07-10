import { useQuery } from '@tanstack/react-query';
import { listPayments } from '@/features/finance/payments/api/payments.api';
import type { ListPaymentsParams } from '@/features/finance/payments/api/payment.types';
import { paymentsQueryKeys } from '@/features/finance/payments/hooks/payments-query-keys';

export function usePayments(params: ListPaymentsParams = {}) {
  return useQuery({
    queryKey: paymentsQueryKeys.list(params),
    queryFn: () => listPayments(params),
  });
}
