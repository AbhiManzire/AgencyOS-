import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRecurringExpense } from '@/features/finance/recurring/api/recurring-expenses.api';
import type { CreateRecurringPayload } from '@/features/finance/recurring/api/recurring.types';
import { recurringExpensesQueryKeys } from '@/features/finance/recurring/hooks/recurring-query-keys';

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRecurringPayload) => createRecurringExpense(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recurringExpensesQueryKeys.all });
    },
  });
}
