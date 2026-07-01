import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInvoice } from '@/features/finance/invoices/api/invoices.api';
import type { UpdateInvoicePayload } from '@/features/finance/invoices/api/invoice.types';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';

interface UpdateInvoiceVariables {
  readonly id: string;
  readonly payload: UpdateInvoicePayload;
}

/** TanStack Query mutation hook for PATCH /invoices/:id. */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateInvoiceVariables) => updateInvoice(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.detail(variables.id) }),
      ]);
    },
  });
}
