import { useQuery } from '@tanstack/react-query';
import {
  getInvoicePaymentSummary,
  listInvoicePayments,
} from '@/features/finance/payments/api/payments.api';
import { paymentsQueryKeys } from '@/features/finance/payments/hooks/payments-query-keys';

export function useInvoicePayments(invoiceId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: paymentsQueryKeys.invoice(invoiceId),
    queryFn: () => listInvoicePayments(invoiceId),
    enabled: options?.enabled ?? invoiceId.length > 0,
  });
}

export function useInvoicePaymentSummary(invoiceId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: paymentsQueryKeys.invoiceSummary(invoiceId),
    queryFn: () => getInvoicePaymentSummary(invoiceId),
    enabled: options?.enabled ?? invoiceId.length > 0,
  });
}
