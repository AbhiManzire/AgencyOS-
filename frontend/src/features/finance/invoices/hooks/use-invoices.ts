import { useQuery } from '@tanstack/react-query';
import { invoiceRecordToListItem } from '@/features/finance/invoices/api/invoice.mapper';
import { listInvoices } from '@/features/finance/invoices/api/invoices.api';
import type { ListInvoicesParams } from '@/features/finance/invoices/api/invoice.types';

export const invoicesQueryKeys = {
  all: ['invoices'] as const,
  list: (params: ListInvoicesParams) => [...invoicesQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...invoicesQueryKeys.all, 'detail', id] as const,
};

export function useInvoices(params: ListInvoicesParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: invoicesQueryKeys.list(params),
    queryFn: async () => {
      const result = await listInvoices(params);
      return {
        ...result,
        items: result.items.map(invoiceRecordToListItem),
      };
    },
    enabled: options?.enabled ?? true,
  });
}
