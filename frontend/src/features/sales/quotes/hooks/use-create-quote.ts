import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuote } from '@/features/sales/quotes/api/quotes.api';
import type { CreateQuotePayload } from '@/features/sales/quotes/api/quote.types';
import { quotesQueryKeys } from '@/features/sales/quotes/hooks/use-quotes';

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateQuotePayload) => createQuote(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
    },
  });
}
