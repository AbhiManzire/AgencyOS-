import type { QueryClient } from '@tanstack/react-query';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';

export const invoiceLineItemsQueryKeys = {
  all: ['invoiceLineItems'] as const,
  list: (invoiceId: string) => [...invoiceLineItemsQueryKeys.all, invoiceId] as const,
};

export async function invalidateInvoiceLineItemCaches(
  queryClient: QueryClient,
  invoiceId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: invoiceLineItemsQueryKeys.list(invoiceId) }),
    queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.detail(invoiceId) }),
    queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all }),
  ]);
}
