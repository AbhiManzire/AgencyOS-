import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type { DashboardSummary } from '@/features/dashboard/api/dashboard.types';

/** Fetches the workspace founder dashboard summary aggregates. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get<ApiSuccessResponse<DashboardSummary>>('/dashboard/summary');
  return response.data.data;
}
