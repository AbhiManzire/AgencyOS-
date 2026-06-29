import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendInvoiceEmail } from '@/features/finance/invoices/api/invoice-delivery.api';
import type { SendInvoiceEmailPayload } from '@/features/finance/invoices/api/invoice-delivery.types';
import { activitiesQueryKeys } from '@/features/activity/hooks/use-activities';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';

export function useSendInvoiceEmail(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendInvoiceEmailPayload) => sendInvoiceEmail(invoiceId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: activitiesQueryKeys.entity('invoice', invoiceId),
        }),
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.detail(invoiceId) }),
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all }),
      ]);
    },
  });
}
