import { useQuery } from '@tanstack/react-query';
import { getQuote } from '@/features/sales/quotes/api/quotes.api';
import { quotesQueryKeys } from '@/features/sales/quotes/hooks/use-quotes';

/** TanStack Query hook for GET /quotes/:id. */
export function useQuote(id: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: quotesQueryKeys.detail(id),
    queryFn: () => getQuote(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
