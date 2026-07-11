import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateInvoicePayload,
  InvoiceRecord,
  ListInvoicesParams,
  ListInvoicesResult,
  UpdateInvoicePayload,
} from '@/features/finance/invoices/api/invoice.types';

export async function listInvoices(params: ListInvoicesParams): Promise<ListInvoicesResult> {
  const response = await apiClient.get<ApiSuccessResponse<InvoiceRecord[]>>('/invoices', {
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

export async function getInvoice(invoiceId: string): Promise<InvoiceRecord> {
  const response = await apiClient.get<ApiSuccessResponse<InvoiceRecord>>(`/invoices/${invoiceId}`);
  return response.data.data;
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<InvoiceRecord> {
  const response = await apiClient.post<ApiSuccessResponse<InvoiceRecord>>('/invoices', payload);
  return response.data.data;
}

export async function updateInvoice(
  invoiceId: string,
  payload: UpdateInvoicePayload,
): Promise<InvoiceRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<InvoiceRecord>>(
    `/invoices/${invoiceId}`,
    payload,
  );
  return response.data.data;
}

export async function markInvoiceViewed(invoiceId: string): Promise<InvoiceRecord> {
  const response = await apiClient.post<ApiSuccessResponse<InvoiceRecord>>(
    `/invoices/${invoiceId}/mark-viewed`,
    {},
  );
  return response.data.data;
}

export async function cancelInvoice(invoiceId: string): Promise<InvoiceRecord> {
  const response = await apiClient.post<ApiSuccessResponse<InvoiceRecord>>(
    `/invoices/${invoiceId}/cancel`,
    {},
  );
  return response.data.data;
}

export async function approveInvoice(invoiceId: string): Promise<InvoiceRecord> {
  const response = await apiClient.post<ApiSuccessResponse<InvoiceRecord>>(
    `/invoices/${invoiceId}/approve`,
    {},
  );
  return response.data.data;
}
