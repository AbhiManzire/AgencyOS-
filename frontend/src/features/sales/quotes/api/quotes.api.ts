import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateQuotePayload,
  ListQuotesParams,
  ListQuotesResult,
  QuoteRecord,
  UpdateQuotePayload,
} from '@/features/sales/quotes/api/quote.types';

export async function listQuotes(params: ListQuotesParams): Promise<ListQuotesResult> {
  const response = await apiClient.get<ApiSuccessResponse<QuoteRecord[]>>('/quotes', { params });
  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}

export async function getQuote(quoteId: string): Promise<QuoteRecord> {
  const response = await apiClient.get<ApiSuccessResponse<QuoteRecord>>(`/quotes/${quoteId}`);
  return response.data.data;
}

export async function createQuote(payload: CreateQuotePayload): Promise<QuoteRecord> {
  const response = await apiClient.post<ApiSuccessResponse<QuoteRecord>>('/quotes', payload);
  return response.data.data;
}

export async function updateQuote(
  quoteId: string,
  payload: UpdateQuotePayload,
): Promise<QuoteRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<QuoteRecord>>(
    `/quotes/${quoteId}`,
    payload,
  );
  return response.data.data;
}
