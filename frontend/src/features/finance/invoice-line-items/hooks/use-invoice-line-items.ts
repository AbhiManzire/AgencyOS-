import { useQuery } from '@tanstack/react-query';
import { invoiceLineItemRecordToListItem } from '@/features/finance/invoice-line-items/api/invoice-line-item.mapper';
import { listInvoiceLineItems } from '@/features/finance/invoice-line-items/api/invoice-line-items.api';
import { invoiceLineItemsQueryKeys } from '@/features/finance/invoice-line-items/hooks/invoice-line-items-query-keys';

export function useInvoiceLineItems(invoiceId: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: invoiceLineItemsQueryKeys.list(invoiceId),
    queryFn: async () => {
      const records = await listInvoiceLineItems(invoiceId);
      return records.map(invoiceLineItemRecordToListItem);
    },
    enabled: (options?.enabled ?? true) && invoiceId.length > 0,
  });
}
