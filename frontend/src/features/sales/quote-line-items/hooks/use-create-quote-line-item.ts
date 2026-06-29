import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuoteLineItem } from '@/features/sales/quote-line-items/api/quote-line-items.api';
import type { CreateQuoteLineItemPayload } from '@/features/sales/quote-line-items/api/quote-line-item.types';
import { invalidateQuoteLineItemCaches } from '@/features/sales/quote-line-items/hooks/quote-line-items-query-keys';

export function useCreateQuoteLineItem(quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateQuoteLineItemPayload) => createQuoteLineItem(quoteId, payload),
    onSuccess: async () => {
      await invalidateQuoteLineItemCaches(queryClient, quoteId);
    },
  });
}
