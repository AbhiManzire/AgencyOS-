import { useQuery } from '@tanstack/react-query';
import { listRecurringInvoices } from '@/features/finance/recurring/api/recurring-invoices.api';
import type { ListRecurringParams } from '@/features/finance/recurring/api/recurring.types';
import { recurringInvoicesQueryKeys } from '@/features/finance/recurring/hooks/recurring-query-keys';

export function useRecurringInvoices(
  params: ListRecurringParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: recurringInvoicesQueryKeys.list(params),
    queryFn: () => listRecurringInvoices(params),
    enabled: options?.enabled ?? true,
  });
}
