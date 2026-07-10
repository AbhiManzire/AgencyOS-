import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { updateInvoice } from '@/features/finance/invoices/api/invoices.api';
import type { UpdateInvoicePayload } from '@/features/finance/invoices/api/invoice.types';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';
import { paymentsQueryKeys } from '@/features/finance/payments/hooks/payments-query-keys';

interface UpdateInvoiceVariables {
  readonly id: string;
  readonly payload: UpdateInvoicePayload;
}

/** TanStack Query mutation hook for PATCH /invoices/:id. */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateInvoiceVariables) => updateInvoice(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
