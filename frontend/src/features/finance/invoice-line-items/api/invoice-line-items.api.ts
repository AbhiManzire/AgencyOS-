import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateInvoiceLineItemPayload,
  InvoiceLineItemRecord,
  UpdateInvoiceLineItemPayload,
} from '@/features/finance/invoice-line-items/api/invoice-line-item.types';

export async function listInvoiceLineItems(
  invoiceId: string,
): Promise<readonly InvoiceLineItemRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<InvoiceLineItemRecord[]>>(
    `/invoices/${invoiceId}/items`,
  );
  return response.data.data;
}

export async function createInvoiceLineItem(
  invoiceId: string,
  payload: CreateInvoiceLineItemPayload,
): Promise<InvoiceLineItemRecord> {
  const response = await apiClient.post<ApiSuccessResponse<InvoiceLineItemRecord>>(
    `/invoices/${invoiceId}/items`,
    payload,
  );
  return response.data.data;
}

export async function updateInvoiceLineItem(
  lineItemId: string,
  payload: UpdateInvoiceLineItemPayload,
): Promise<InvoiceLineItemRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<InvoiceLineItemRecord>>(
    `/invoice-items/${lineItemId}`,
    payload,
  );
  return response.data.data;
}

export async function deleteInvoiceLineItem(lineItemId: string): Promise<InvoiceLineItemRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<InvoiceLineItemRecord>>(
    `/invoice-items/${lineItemId}`,
  );
  return response.data.data;
}
