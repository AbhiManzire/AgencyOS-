import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type { CreateTaskPayload, UpdateTaskPayload } from '@/features/tasks/api/task-payload.types';
import type { ListTasksParams, ListTasksResult, TaskRecord } from '@/features/tasks/api/task.types';

/** Fetches a paginated list of tasks for the active workspace. */
export async function listTasks(params: ListTasksParams): Promise<ListTasksResult> {
  const response = await apiClient.get<ApiSuccessResponse<TaskRecord[]>>('/tasks', {
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

/** Creates a task in the active workspace. */
export async function createTask(payload: CreateTaskPayload): Promise<TaskRecord> {
  const response = await apiClient.post<ApiSuccessResponse<TaskRecord>>('/tasks', payload);
  return response.data.data;
}

/** Updates a task in the active workspace. */
export async function updateTask(taskId: string, payload: UpdateTaskPayload): Promise<TaskRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<TaskRecord>>(
    `/tasks/${taskId}`,
    payload,
  );
  return response.data.data;
}

/** Fetches a single task by id for the active workspace. */
export async function getTask(id: string): Promise<TaskRecord> {
  const response = await apiClient.get<ApiSuccessResponse<TaskRecord>>(`/tasks/${id}`);
  return response.data.data;
}
