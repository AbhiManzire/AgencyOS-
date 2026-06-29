import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvoice } from '@/features/finance/invoices/api/invoices.api';
import type { CreateInvoicePayload } from '@/features/finance/invoices/api/invoice.types';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => createInvoice(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
    },
  });
}
