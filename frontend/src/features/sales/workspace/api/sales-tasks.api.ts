import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateSalesTaskPayload,
  ListSalesTasksParams,
  ListSalesTasksResult,
  ReassignSalesTaskPayload,
  RescheduleSalesTaskPayload,
  SalesTaskRecord,
  UpdateSalesTaskPayload,
} from '@/features/sales/workspace/api/sales-task.types';

/** Lists sales tasks (defaults to current user on the backend). */
export async function listSalesTasks(
  params: ListSalesTasksParams = {},
): Promise<ListSalesTasksResult> {
  const response = await apiClient.get<ApiSuccessResponse<SalesTaskRecord[]>>('/sales-tasks', {
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

/** Fetches a single sales task by id. */
export async function getSalesTask(id: string): Promise<SalesTaskRecord> {
  const response = await apiClient.get<ApiSuccessResponse<SalesTaskRecord>>(`/sales-tasks/${id}`);
  return response.data.data;
}

/** Creates a sales task. */
export async function createSalesTask(payload: CreateSalesTaskPayload): Promise<SalesTaskRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SalesTaskRecord>>(
    '/sales-tasks',
    payload,
  );
  return response.data.data;
}

/** Updates a sales task. */
export async function updateSalesTask(
  id: string,
  payload: UpdateSalesTaskPayload,
): Promise<SalesTaskRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<SalesTaskRecord>>(
    `/sales-tasks/${id}`,
    payload,
  );
  return response.data.data;
}

/** Marks a sales task complete. */
export async function completeSalesTask(id: string): Promise<SalesTaskRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SalesTaskRecord>>(
    `/sales-tasks/${id}/complete`,
    {},
  );
  return response.data.data;
}

/** Cancels a sales task. */
export async function cancelSalesTask(id: string): Promise<SalesTaskRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SalesTaskRecord>>(
    `/sales-tasks/${id}/cancel`,
    {},
  );
  return response.data.data;
}

/** Reschedules a sales task. */
export async function rescheduleSalesTask(
  id: string,
  payload: RescheduleSalesTaskPayload,
): Promise<SalesTaskRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SalesTaskRecord>>(
    `/sales-tasks/${id}/reschedule`,
    payload,
  );
  return response.data.data;
}

/** Reassigns a sales task to another owner. */
export async function reassignSalesTask(
  id: string,
  payload: ReassignSalesTaskPayload,
): Promise<SalesTaskRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SalesTaskRecord>>(
    `/sales-tasks/${id}/reassign`,
    payload,
  );
  return response.data.data;
}
