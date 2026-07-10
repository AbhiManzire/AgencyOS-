import type { QueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';
import { paymentsQueryKeys } from '@/features/finance/payments/hooks/payments-query-keys';

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
    queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.all }),
    invalidateDashboardSummary(queryClient),
  ]);
}
