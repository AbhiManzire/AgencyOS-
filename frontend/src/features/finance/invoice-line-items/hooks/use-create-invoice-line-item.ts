import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvoiceLineItem } from '@/features/finance/invoice-line-items/api/invoice-line-items.api';
import type { CreateInvoiceLineItemPayload } from '@/features/finance/invoice-line-items/api/invoice-line-item.types';
import { invalidateInvoiceLineItemCaches } from '@/features/finance/invoice-line-items/hooks/invoice-line-items-query-keys';

export function useCreateInvoiceLineItem(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInvoiceLineItemPayload) =>
      createInvoiceLineItem(invoiceId, payload),
    onSuccess: async () => {
      await invalidateInvoiceLineItemCaches(queryClient, invoiceId);
    },
  });
}
