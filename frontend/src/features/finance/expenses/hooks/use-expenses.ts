import { useQuery } from '@tanstack/react-query';
import { listExpenses } from '@/features/finance/expenses/api/expenses.api';
import type { ListExpensesParams } from '@/features/finance/expenses/api/expense.types';

export const expensesQueryKeys = {
  all: ['expenses'] as const,
  list: (params: ListExpensesParams) => [...expensesQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...expensesQueryKeys.all, 'detail', id] as const,
};

/** TanStack Query hook for GET /expenses. */
export function useExpenses(params: ListExpensesParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: expensesQueryKeys.list(params),
    queryFn: () => listExpenses(params),
    enabled: options?.enabled ?? true,
  });
}
