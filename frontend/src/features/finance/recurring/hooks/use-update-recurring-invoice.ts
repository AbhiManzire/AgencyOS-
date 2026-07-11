import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateRecurringInvoice } from '@/features/finance/recurring/api/recurring-invoices.api';
import type { UpdateRecurringPayload } from '@/features/finance/recurring/api/recurring.types';
import { recurringInvoicesQueryKeys } from '@/features/finance/recurring/hooks/recurring-query-keys';

export function useUpdateRecurringInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRecurringPayload }) =>
      updateRecurringInvoice(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: recurringInvoicesQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: recurringInvoicesQueryKeys.detail(variables.id),
        }),
      ]);
    },
  });
}
