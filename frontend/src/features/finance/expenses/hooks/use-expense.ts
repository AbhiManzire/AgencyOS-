import { useQuery } from '@tanstack/react-query';
import { getExpense } from '@/features/finance/expenses/api/expenses.api';
import { expensesQueryKeys } from '@/features/finance/expenses/hooks/use-expenses';

/** TanStack Query hook for GET /expenses/:id. */
export function useExpense(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: expensesQueryKeys.detail(id),
    queryFn: () => getExpense(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
