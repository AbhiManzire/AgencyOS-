import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInvoiceLineItem } from '@/features/finance/invoice-line-items/api/invoice-line-items.api';
import type { UpdateInvoiceLineItemPayload } from '@/features/finance/invoice-line-items/api/invoice-line-item.types';
import { invalidateInvoiceLineItemCaches } from '@/features/finance/invoice-line-items/hooks/invoice-line-items-query-keys';

interface UpdateInvoiceLineItemVariables {
  readonly lineItemId: string;
  readonly payload: UpdateInvoiceLineItemPayload;
}

export function useUpdateInvoiceLineItem(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lineItemId, payload }: UpdateInvoiceLineItemVariables) =>
      updateInvoiceLineItem(lineItemId, payload),
    onSuccess: async () => {
      await invalidateInvoiceLineItemCaches(queryClient, invoiceId);
    },
  });
}
