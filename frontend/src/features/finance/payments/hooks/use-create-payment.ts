import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { createInvoicePayment, createPayment } from '@/features/finance/payments/api/payments.api';
import type { CreatePaymentPayload } from '@/features/finance/payments/api/payment.types';
import { paymentsQueryKeys } from '@/features/finance/payments/hooks/payments-query-keys';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => createPayment(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}

export function useCreateInvoicePayment(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<CreatePaymentPayload, 'invoiceId'>) =>
      createInvoicePayment(invoiceId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
