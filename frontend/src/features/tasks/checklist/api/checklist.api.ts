import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateTaskChecklistItemPayload,
  TaskChecklistItemRecord,
  UpdateTaskChecklistItemPayload,
} from '@/features/tasks/checklist/api/checklist.types';

/** Lists checklist items for a task. */
export async function listTaskChecklist(
  taskId: string,
): Promise<readonly TaskChecklistItemRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<TaskChecklistItemRecord[]>>(
    `/tasks/${taskId}/checklist`,
  );
  return response.data.data;
}

/** Creates a checklist item on a task. */
export async function createTaskChecklistItem(
  taskId: string,
  payload: CreateTaskChecklistItemPayload,
): Promise<TaskChecklistItemRecord> {
  const response = await apiClient.post<ApiSuccessResponse<TaskChecklistItemRecord>>(
    `/tasks/${taskId}/checklist`,
    payload,
  );
  return response.data.data;
}

/** Updates a checklist item. */
export async function updateTaskChecklistItem(
  taskId: string,
  itemId: string,
  payload: UpdateTaskChecklistItemPayload,
): Promise<TaskChecklistItemRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<TaskChecklistItemRecord>>(
    `/tasks/${taskId}/checklist/${itemId}`,
    payload,
  );
  return response.data.data;
}

/** Deletes a checklist item. */
export async function deleteTaskChecklistItem(taskId: string, itemId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}/checklist/${itemId}`);
}
