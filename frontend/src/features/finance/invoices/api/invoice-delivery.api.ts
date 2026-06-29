import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  InvoiceEmailResult,
  InvoicePdfResult,
  SendInvoiceEmailPayload,
} from '@/features/finance/invoices/api/invoice-delivery.types';

export async function generateInvoicePdf(invoiceId: string): Promise<InvoicePdfResult> {
  const response = await apiClient.post<ApiSuccessResponse<InvoicePdfResult>>(
    `/invoices/${invoiceId}/pdf`,
  );
  return response.data.data;
}

export async function fetchInvoicePdfBlob(
  invoiceId: string,
  options?: { readonly download?: boolean },
): Promise<Blob> {
  const response = await apiClient.get<ArrayBuffer>(`/invoices/${invoiceId}/pdf`, {
    responseType: 'arraybuffer',
    params: options?.download ? { download: 'true' } : undefined,
  });

  const contentType = response.headers['content-type'];
  const mimeType = typeof contentType === 'string' ? contentType : 'application/pdf';

  return new Blob([response.data], { type: mimeType });
}

export async function previewInvoicePdf(invoiceId: string): Promise<void> {
  const blob = await fetchInvoicePdfBlob(invoiceId);
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

export async function downloadInvoicePdf(invoiceId: string, fileName: string): Promise<void> {
  const blob = await fetchInvoicePdfBlob(invoiceId, { download: true });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function sendInvoiceEmail(
  invoiceId: string,
  payload: SendInvoiceEmailPayload = {},
): Promise<InvoiceEmailResult> {
  const response = await apiClient.post<ApiSuccessResponse<InvoiceEmailResult>>(
    `/invoices/${invoiceId}/email`,
    payload,
  );
  return response.data.data;
}
