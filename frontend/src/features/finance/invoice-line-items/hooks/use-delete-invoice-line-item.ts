import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteInvoiceLineItem } from '@/features/finance/invoice-line-items/api/invoice-line-items.api';
import { invalidateInvoiceLineItemCaches } from '@/features/finance/invoice-line-items/hooks/invoice-line-items-query-keys';

export function useDeleteInvoiceLineItem(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lineItemId: string) => deleteInvoiceLineItem(lineItemId),
    onSuccess: async () => {
      await invalidateInvoiceLineItemCaches(queryClient, invoiceId);
    },
  });
}
