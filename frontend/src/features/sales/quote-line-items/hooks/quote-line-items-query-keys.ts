import type { QueryClient } from '@tanstack/react-query';
import { quotesQueryKeys } from '@/features/sales/quotes/hooks/use-quotes';

export const quoteLineItemsQueryKeys = {
  all: ['quoteLineItems'] as const,
  list: (quoteId: string) => [...quoteLineItemsQueryKeys.all, quoteId] as const,
};

export async function invalidateQuoteLineItemCaches(
  queryClient: QueryClient,
  quoteId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: quoteLineItemsQueryKeys.list(quoteId) }),
    queryClient.invalidateQueries({ queryKey: quotesQueryKeys.detail(quoteId) }),
    queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all }),
  ]);
}
