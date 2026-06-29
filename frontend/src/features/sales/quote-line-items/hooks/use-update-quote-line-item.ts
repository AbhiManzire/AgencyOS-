import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateQuoteLineItem } from '@/features/sales/quote-line-items/api/quote-line-items.api';
import type { UpdateQuoteLineItemPayload } from '@/features/sales/quote-line-items/api/quote-line-item.types';
import { invalidateQuoteLineItemCaches } from '@/features/sales/quote-line-items/hooks/quote-line-items-query-keys';

interface UpdateQuoteLineItemVariables {
  readonly lineItemId: string;
  readonly payload: UpdateQuoteLineItemPayload;
}

export function useUpdateQuoteLineItem(quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lineItemId, payload }: UpdateQuoteLineItemVariables) =>
      updateQuoteLineItem(lineItemId, payload),
    onSuccess: async () => {
      await invalidateQuoteLineItemCaches(queryClient, quoteId);
    },
  });
}
