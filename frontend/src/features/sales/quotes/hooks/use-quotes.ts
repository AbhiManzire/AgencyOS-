import { useQuery } from '@tanstack/react-query';
import { quoteRecordToListItem } from '@/features/sales/quotes/api/quote.mapper';
import { listQuotes } from '@/features/sales/quotes/api/quotes.api';
import type { ListQuotesParams } from '@/features/sales/quotes/api/quote.types';

export const quotesQueryKeys = {
  all: ['quotes'] as const,
  list: (params: ListQuotesParams) => [...quotesQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...quotesQueryKeys.all, 'detail', id] as const,
};

export function useQuotes(params: ListQuotesParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: quotesQueryKeys.list(params),
    queryFn: async () => {
      const result = await listQuotes(params);
      return {
        ...result,
        items: result.items.map(quoteRecordToListItem),
      };
    },
    enabled: options?.enabled ?? true,
  });
}
