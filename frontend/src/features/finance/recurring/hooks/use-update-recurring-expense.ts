import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateRecurringExpense } from '@/features/finance/recurring/api/recurring-expenses.api';
import type { UpdateRecurringPayload } from '@/features/finance/recurring/api/recurring.types';
import { recurringExpensesQueryKeys } from '@/features/finance/recurring/hooks/recurring-query-keys';

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRecurringPayload }) =>
      updateRecurringExpense(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: recurringExpensesQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: recurringExpensesQueryKeys.detail(variables.id),
        }),
      ]);
    },
  });
}
