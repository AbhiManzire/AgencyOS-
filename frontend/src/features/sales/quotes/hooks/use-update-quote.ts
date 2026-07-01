import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateQuote } from '@/features/sales/quotes/api/quotes.api';
import type { UpdateQuotePayload } from '@/features/sales/quotes/api/quote.types';
import { quotesQueryKeys } from '@/features/sales/quotes/hooks/use-quotes';

interface UpdateQuoteVariables {
  readonly id: string;
  readonly payload: UpdateQuotePayload;
}

/** TanStack Query mutation hook for PATCH /quotes/:id. */
export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateQuoteVariables) => updateQuote(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: quotesQueryKeys.detail(variables.id) }),
      ]);
    },
  });
}
