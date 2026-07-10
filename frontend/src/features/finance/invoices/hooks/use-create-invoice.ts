import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { createInvoice } from '@/features/finance/invoices/api/invoices.api';
import type { CreateInvoicePayload } from '@/features/finance/invoices/api/invoice.types';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => createInvoice(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
