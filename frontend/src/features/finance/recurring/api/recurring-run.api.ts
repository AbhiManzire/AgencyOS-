import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type { RunDueResult } from '@/features/finance/recurring/api/recurring.types';

export async function runDueRecurring(): Promise<RunDueResult> {
  const response = await apiClient.post<ApiSuccessResponse<RunDueResult>>('/recurring/run-due', {});
  return response.data.data;
}
