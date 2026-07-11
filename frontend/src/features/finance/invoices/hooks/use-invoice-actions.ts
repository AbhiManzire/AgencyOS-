import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import {
  approveInvoice,
  cancelInvoice,
  markInvoiceViewed,
} from '@/features/finance/invoices/api/invoices.api';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';
import { paymentsQueryKeys } from '@/features/finance/payments/hooks/payments-query-keys';

async function invalidateInvoiceQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.all }),
    invalidateDashboardSummary(queryClient),
  ]);
}

/** Marks an invoice as viewed. */
export function useMarkInvoiceViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => markInvoiceViewed(invoiceId),
    onSuccess: async () => {
      await invalidateInvoiceQueries(queryClient);
    },
  });
}

/** Cancels an invoice. */
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => cancelInvoice(invoiceId),
    onSuccess: async () => {
      await invalidateInvoiceQueries(queryClient);
    },
  });
}

/** Approves an invoice. */
export function useApproveInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => approveInvoice(invoiceId),
    onSuccess: async () => {
      await invalidateInvoiceQueries(queryClient);
    },
  });
}
