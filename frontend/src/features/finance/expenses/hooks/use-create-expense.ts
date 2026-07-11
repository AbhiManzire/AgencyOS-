import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createExpense } from '@/features/finance/expenses/api/expenses.api';
import type { CreateExpensePayload } from '@/features/finance/expenses/api/expense.types';
import { expensesQueryKeys } from '@/features/finance/expenses/hooks/use-expenses';

/** TanStack Query mutation for POST /expenses. */
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => createExpense(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all });
    },
  });
}
