import type { ListPaymentsParams } from '@/features/finance/payments/api/payment.types';

export const paymentsQueryKeys = {
  all: ['payments'] as const,
  list: (params: ListPaymentsParams) => [...paymentsQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...paymentsQueryKeys.all, 'detail', id] as const,
  invoice: (invoiceId: string) => [...paymentsQueryKeys.all, 'invoice', invoiceId] as const,
  invoiceSummary: (invoiceId: string) =>
    [...paymentsQueryKeys.all, 'invoice-summary', invoiceId] as const,
};
