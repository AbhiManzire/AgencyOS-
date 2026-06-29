import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteQuoteLineItem } from '@/features/sales/quote-line-items/api/quote-line-items.api';
import { invalidateQuoteLineItemCaches } from '@/features/sales/quote-line-items/hooks/quote-line-items-query-keys';

export function useDeleteQuoteLineItem(quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lineItemId: string) => deleteQuoteLineItem(lineItemId),
    onSuccess: async () => {
      await invalidateQuoteLineItemCaches(queryClient, quoteId);
    },
  });
}
