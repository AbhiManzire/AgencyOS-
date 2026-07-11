import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateExpensePayload,
  ExpenseRecord,
  ListExpensesParams,
  ListExpensesResult,
  UpdateExpensePayload,
} from '@/features/finance/expenses/api/expense.types';

/** Fetches a paginated list of expenses for the active workspace. */
export async function listExpenses(params: ListExpensesParams): Promise<ListExpensesResult> {
  const response = await apiClient.get<ApiSuccessResponse<ExpenseRecord[]>>('/expenses', {
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

/** Fetches a single expense by id. */
export async function getExpense(id: string): Promise<ExpenseRecord> {
  const response = await apiClient.get<ApiSuccessResponse<ExpenseRecord>>(`/expenses/${id}`);
  return response.data.data;
}

/** Creates an expense in the active workspace. */
export async function createExpense(payload: CreateExpensePayload): Promise<ExpenseRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ExpenseRecord>>('/expenses', payload);
  return response.data.data;
}

/** Updates an existing expense. */
export async function updateExpense(
  id: string,
  payload: UpdateExpensePayload,
): Promise<ExpenseRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<ExpenseRecord>>(
    `/expenses/${id}`,
    payload,
  );
  return response.data.data;
}

/** Approves a pending expense. */
export async function approveExpense(id: string): Promise<ExpenseRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ExpenseRecord>>(
    `/expenses/${id}/approve`,
    {},
  );
  return response.data.data;
}

/** Rejects a pending expense. */
export async function rejectExpense(id: string): Promise<ExpenseRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ExpenseRecord>>(
    `/expenses/${id}/reject`,
    {},
  );
  return response.data.data;
}

/** Archives an expense (DELETE /expenses/:id). */
export async function archiveExpense(id: string): Promise<ExpenseRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<ExpenseRecord>>(`/expenses/${id}`);
  return response.data.data;
}
