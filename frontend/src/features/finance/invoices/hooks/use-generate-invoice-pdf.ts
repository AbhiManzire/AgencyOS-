import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateInvoicePdf } from '@/features/finance/invoices/api/invoice-delivery.api';
import { activitiesQueryKeys } from '@/features/activity/hooks/use-activities';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';

export function useGenerateInvoicePdf(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateInvoicePdf(invoiceId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: activitiesQueryKeys.entity('invoice', invoiceId),
        }),
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.detail(invoiceId) }),
      ]);
    },
  });
}
