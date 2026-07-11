import { useQuery } from '@tanstack/react-query';
import { listRecurringExpenses } from '@/features/finance/recurring/api/recurring-expenses.api';
import type { ListRecurringParams } from '@/features/finance/recurring/api/recurring.types';
import { recurringExpensesQueryKeys } from '@/features/finance/recurring/hooks/recurring-query-keys';

export function useRecurringExpenses(
  params: ListRecurringParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: recurringExpensesQueryKeys.list(params),
    queryFn: () => listRecurringExpenses(params),
    enabled: options?.enabled ?? true,
  });
}
