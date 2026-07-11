import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRecurringExpense } from '@/features/finance/recurring/api/recurring-expenses.api';
import { recurringExpensesQueryKeys } from '@/features/finance/recurring/hooks/recurring-query-keys';

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRecurringExpense(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recurringExpensesQueryKeys.all });
    },
  });
}
