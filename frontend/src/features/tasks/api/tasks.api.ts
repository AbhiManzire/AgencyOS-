import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type { CreateTaskPayload, UpdateTaskPayload } from '@/features/tasks/api/task-payload.types';
import type {
  AssignTaskTagPayload,
  CreateTaskDependencyPayload,
  ListTasksParams,
  ListTasksResult,
  TaskDependencyRecord,
  TaskRecord,
  TaskTagRecord,
} from '@/features/tasks/api/task.types';

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

/** Soft-archives a task (DELETE /tasks/:id). */
export async function archiveTask(id: string): Promise<TaskRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<TaskRecord>>(`/tasks/${id}`);
  return response.data.data;
}

/** Restores an archived task (POST /tasks/:id/restore). */
export async function restoreTask(id: string): Promise<TaskRecord> {
  const response = await apiClient.post<ApiSuccessResponse<TaskRecord>>(`/tasks/${id}/restore`);
  return response.data.data;
}

/** Lists tasks this task is blocked by (depends on). */
export async function listTaskDependencies(
  taskId: string,
): Promise<readonly TaskDependencyRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<TaskDependencyRecord[]>>(
    `/tasks/${taskId}/dependencies`,
  );
  return response.data.data;
}

/** Adds a blocked-by dependency. */
export async function createTaskDependency(
  taskId: string,
  payload: CreateTaskDependencyPayload,
): Promise<TaskDependencyRecord> {
  const response = await apiClient.post<ApiSuccessResponse<TaskDependencyRecord>>(
    `/tasks/${taskId}/dependencies`,
    payload,
  );
  return response.data.data;
}

/** Removes a dependency by id. */
export async function deleteTaskDependency(taskId: string, dependencyId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
}

/** Lists tags assigned to a task. */
export async function listTaskTags(taskId: string): Promise<readonly TaskTagRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<TaskTagRecord[]>>(
    `/tasks/${taskId}/tags`,
  );
  return response.data.data;
}

/** Assigns a tag to a task by name (find-or-create). */
export async function assignTaskTag(
  taskId: string,
  payload: AssignTaskTagPayload,
): Promise<TaskTagRecord> {
  const response = await apiClient.post<ApiSuccessResponse<TaskTagRecord>>(
    `/tasks/${taskId}/tags`,
    payload,
  );
  return response.data.data;
}

/** Unassigns a tag from a task. */
export async function unassignTaskTag(taskId: string, tagId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}/tags/${tagId}`);
}
