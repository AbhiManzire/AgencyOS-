import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateRecurringPayload,
  ListRecurringParams,
  ListRecurringResult,
  RecurringRecord,
  UpdateRecurringPayload,
} from '@/features/finance/recurring/api/recurring.types';

export async function listRecurringExpenses(
  params: ListRecurringParams = {},
): Promise<ListRecurringResult> {
  const response = await apiClient.get<ApiSuccessResponse<RecurringRecord[]>>(
    '/recurring-expenses',
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

export async function getRecurringExpense(id: string): Promise<RecurringRecord> {
  const response = await apiClient.get<ApiSuccessResponse<RecurringRecord>>(
    `/recurring-expenses/${id}`,
  );
  return response.data.data;
}

export async function createRecurringExpense(
  payload: CreateRecurringPayload,
): Promise<RecurringRecord> {
  const response = await apiClient.post<ApiSuccessResponse<RecurringRecord>>(
    '/recurring-expenses',
    payload,
  );
  return response.data.data;
}

export async function updateRecurringExpense(
  id: string,
  payload: UpdateRecurringPayload,
): Promise<RecurringRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<RecurringRecord>>(
    `/recurring-expenses/${id}`,
    payload,
  );
  return response.data.data;
}

export async function deleteRecurringExpense(id: string): Promise<RecurringRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<RecurringRecord>>(
    `/recurring-expenses/${id}`,
  );
  return response.data.data;
}
