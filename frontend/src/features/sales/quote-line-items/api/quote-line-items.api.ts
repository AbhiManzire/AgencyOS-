import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateQuoteLineItemPayload,
  QuoteLineItemRecord,
  UpdateQuoteLineItemPayload,
} from '@/features/sales/quote-line-items/api/quote-line-item.types';

export async function listQuoteLineItems(quoteId: string): Promise<readonly QuoteLineItemRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<QuoteLineItemRecord[]>>(
    `/quotes/${quoteId}/items`,
  );
  return response.data.data;
}

export async function createQuoteLineItem(
  quoteId: string,
  payload: CreateQuoteLineItemPayload,
): Promise<QuoteLineItemRecord> {
  const response = await apiClient.post<ApiSuccessResponse<QuoteLineItemRecord>>(
    `/quotes/${quoteId}/items`,
    payload,
  );
  return response.data.data;
}

export async function updateQuoteLineItem(
  lineItemId: string,
  payload: UpdateQuoteLineItemPayload,
): Promise<QuoteLineItemRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<QuoteLineItemRecord>>(
    `/quote-items/${lineItemId}`,
    payload,
  );
  return response.data.data;
}

export async function deleteQuoteLineItem(lineItemId: string): Promise<QuoteLineItemRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<QuoteLineItemRecord>>(
    `/quote-items/${lineItemId}`,
  );
  return response.data.data;
}
