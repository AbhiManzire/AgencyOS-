import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRecurringInvoice } from '@/features/finance/recurring/api/recurring-invoices.api';
import type { CreateRecurringPayload } from '@/features/finance/recurring/api/recurring.types';
import { recurringInvoicesQueryKeys } from '@/features/finance/recurring/hooks/recurring-query-keys';

export function useCreateRecurringInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRecurringPayload) => createRecurringInvoice(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recurringInvoicesQueryKeys.all });
    },
  });
}
