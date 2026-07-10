import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreatePaymentPayload,
  InvoicePaymentSummary,
  ListPaymentsParams,
  ListPaymentsResult,
  PaymentRecord,
} from '@/features/finance/payments/api/payment.types';

export async function listPayments(params: ListPaymentsParams = {}): Promise<ListPaymentsResult> {
  const response = await apiClient.get<ApiSuccessResponse<PaymentRecord[]>>('/payments', {
    params,
  });
  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}

export async function getPayment(paymentId: string): Promise<PaymentRecord> {
  const response = await apiClient.get<ApiSuccessResponse<PaymentRecord>>(`/payments/${paymentId}`);
  return response.data.data;
}

export async function createPayment(payload: CreatePaymentPayload): Promise<PaymentRecord> {
  const response = await apiClient.post<ApiSuccessResponse<PaymentRecord>>('/payments', payload);
  return response.data.data;
}

export async function listInvoicePayments(invoiceId: string): Promise<readonly PaymentRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<PaymentRecord[]>>(
    `/invoices/${invoiceId}/payments`,
  );
  return response.data.data;
}

export async function getInvoicePaymentSummary(invoiceId: string): Promise<InvoicePaymentSummary> {
  const response = await apiClient.get<ApiSuccessResponse<InvoicePaymentSummary>>(
    `/invoices/${invoiceId}/payments/summary`,
  );
  return response.data.data;
}

export async function createInvoicePayment(
  invoiceId: string,
  payload: Omit<CreatePaymentPayload, 'invoiceId'>,
): Promise<PaymentRecord> {
  const response = await apiClient.post<ApiSuccessResponse<PaymentRecord>>(
    `/invoices/${invoiceId}/payments`,
    payload,
  );
  return response.data.data;
}
