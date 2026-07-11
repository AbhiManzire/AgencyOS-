import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateRecurringPayload,
  ListRecurringParams,
  ListRecurringResult,
  RecurringRecord,
  UpdateRecurringPayload,
} from '@/features/finance/recurring/api/recurring.types';

export async function listRecurringInvoices(
  params: ListRecurringParams = {},
): Promise<ListRecurringResult> {
  const response = await apiClient.get<ApiSuccessResponse<RecurringRecord[]>>(
    '/recurring-invoices',
    { params },
  );
  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}

export async function getRecurringInvoice(id: string): Promise<RecurringRecord> {
  const response = await apiClient.get<ApiSuccessResponse<RecurringRecord>>(
    `/recurring-invoices/${id}`,
  );
  return response.data.data;
}

export async function createRecurringInvoice(
  payload: CreateRecurringPayload,
): Promise<RecurringRecord> {
  const response = await apiClient.post<ApiSuccessResponse<RecurringRecord>>(
    '/recurring-invoices',
    payload,
  );
  return response.data.data;
}

export async function updateRecurringInvoice(
  id: string,
  payload: UpdateRecurringPayload,
): Promise<RecurringRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<RecurringRecord>>(
    `/recurring-invoices/${id}`,
    payload,
  );
  return response.data.data;
}

export async function deleteRecurringInvoice(id: string): Promise<RecurringRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<RecurringRecord>>(
    `/recurring-invoices/${id}`,
  );
  return response.data.data;
}
