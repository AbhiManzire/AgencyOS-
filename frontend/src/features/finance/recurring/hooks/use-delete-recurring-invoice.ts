import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRecurringInvoice } from '@/features/finance/recurring/api/recurring-invoices.api';
import { recurringInvoicesQueryKeys } from '@/features/finance/recurring/hooks/recurring-query-keys';

export function useDeleteRecurringInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRecurringInvoice(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recurringInvoicesQueryKeys.all });
    },
  });
}
