import { useQuery } from '@tanstack/react-query';
import { listQuoteRevisions } from '@/features/sales/quotes/api/quotes.api';
import { quotesQueryKeys } from '@/features/sales/quotes/hooks/use-quotes';

/** TanStack Query hook for GET /quotes/:id/revisions. */
export function useQuoteRevisions(quoteId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...quotesQueryKeys.detail(quoteId), 'revisions'] as const,
    queryFn: () => listQuoteRevisions(quoteId),
    enabled: (options?.enabled ?? true) && quoteId.length > 0,
  });
}
