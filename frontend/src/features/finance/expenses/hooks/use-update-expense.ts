import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateExpense } from '@/features/finance/expenses/api/expenses.api';
import type { UpdateExpensePayload } from '@/features/finance/expenses/api/expense.types';
import { expensesQueryKeys } from '@/features/finance/expenses/hooks/use-expenses';

/** TanStack Query mutation for PATCH /expenses/:id. */
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExpensePayload }) =>
      updateExpense(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(variables.id) }),
      ]);
    },
  });
}
