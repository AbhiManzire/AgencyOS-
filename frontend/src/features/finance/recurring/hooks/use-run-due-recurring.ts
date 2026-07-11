import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runDueRecurring } from '@/features/finance/recurring/api/recurring-run.api';
import {
  recurringExpensesQueryKeys,
  recurringInvoicesQueryKeys,
} from '@/features/finance/recurring/hooks/recurring-query-keys';

export function useRunDueRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => runDueRecurring(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: recurringInvoicesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: recurringExpensesQueryKeys.all }),
      ]);
    },
  });
}
