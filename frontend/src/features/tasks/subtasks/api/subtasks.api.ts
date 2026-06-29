import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateSubtaskPayload,
  ListSubtasksResult,
  SubtaskRecord,
  UpdateSubtaskPayload,
} from '@/features/tasks/subtasks/api/subtask.types';

/** Fetches subtasks for a parent task. */
export async function listSubtasks(taskId: string): Promise<ListSubtasksResult> {
  const response = await apiClient.get<ApiSuccessResponse<readonly SubtaskRecord[]>>(
    `/tasks/${taskId}/subtasks`,
  );
  return { subtasks: response.data.data };
}

/** Creates a subtask under a parent task. */
export async function createSubtask(
  taskId: string,
  payload: CreateSubtaskPayload,
): Promise<SubtaskRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SubtaskRecord>>(
    `/tasks/${taskId}/subtasks`,
    payload,
  );
  return response.data.data;
}

/** Updates a subtask under a parent task. */
export async function updateSubtask(
  taskId: string,
  subtaskId: string,
  payload: UpdateSubtaskPayload,
): Promise<SubtaskRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<SubtaskRecord>>(
    `/tasks/${taskId}/subtasks/${subtaskId}`,
    payload,
  );
  return response.data.data;
}

/** Soft-deletes a subtask under a parent task. */
export async function deleteSubtask(taskId: string, subtaskId: string): Promise<SubtaskRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<SubtaskRecord>>(
    `/tasks/${taskId}/subtasks/${subtaskId}`,
  );
  return response.data.data;
}
