import { useQuery } from '@tanstack/react-query';
import { quoteLineItemRecordToListItem } from '@/features/sales/quote-line-items/api/quote-line-item.mapper';
import { listQuoteLineItems } from '@/features/sales/quote-line-items/api/quote-line-items.api';
import { quoteLineItemsQueryKeys } from '@/features/sales/quote-line-items/hooks/quote-line-items-query-keys';

export function useQuoteLineItems(quoteId: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: quoteLineItemsQueryKeys.list(quoteId),
    queryFn: async () => {
      const records = await listQuoteLineItems(quoteId);
      return records.map(quoteLineItemRecordToListItem);
    },
    enabled: (options?.enabled ?? true) && quoteId.length > 0,
  });
}
