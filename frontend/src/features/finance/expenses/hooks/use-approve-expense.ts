import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveExpense } from '@/features/finance/expenses/api/expenses.api';
import { expensesQueryKeys } from '@/features/finance/expenses/hooks/use-expenses';

/** TanStack Query mutation for POST /expenses/:id/approve. */
export function useApproveExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approveExpense(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(id) }),
      ]);
    },
  });
}
