import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveExpense } from '@/features/finance/expenses/api/expenses.api';
import { expensesQueryKeys } from '@/features/finance/expenses/hooks/use-expenses';

/** TanStack Query mutation for DELETE /expenses/:id (archive). */
export function useArchiveExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveExpense(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(id) }),
      ]);
    },
  });
}
