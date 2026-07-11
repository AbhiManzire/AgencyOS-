import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rejectExpense } from '@/features/finance/expenses/api/expenses.api';
import { expensesQueryKeys } from '@/features/finance/expenses/hooks/use-expenses';

/** TanStack Query mutation for POST /expenses/:id/reject. */
export function useRejectExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rejectExpense(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(id) }),
      ]);
    },
  });
}
