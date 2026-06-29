import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateTimeEntryPayload,
  ListTaskTimeEntriesResult,
  StartTimeEntryPayload,
  StopTimeEntryPayload,
  TimeEntryRecord,
  UpdateTimeEntryPayload,
} from '@/features/time-entries/api/time-entry.types';

/** Fetches time entries for a task. */
export async function listTaskTimeEntries(taskId: string): Promise<ListTaskTimeEntriesResult> {
  const response = await apiClient.get<ApiSuccessResponse<readonly TimeEntryRecord[]>>(
    `/tasks/${taskId}/time`,
  );
  return { entries: response.data.data };
}

/** Creates a time entry on a task. */
export async function createTimeEntry(
  taskId: string,
  payload: CreateTimeEntryPayload,
): Promise<TimeEntryRecord> {
  const response = await apiClient.post<ApiSuccessResponse<TimeEntryRecord>>(
    `/tasks/${taskId}/time`,
    payload,
  );
  return response.data.data;
}

/** Updates a time entry by id. */
export async function updateTimeEntry(
  timeEntryId: string,
  payload: UpdateTimeEntryPayload,
): Promise<TimeEntryRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<TimeEntryRecord>>(
    `/time/${timeEntryId}`,
    payload,
  );
  return response.data.data;
}

/** Fetches the current user's active running timer, if any. */
export async function getActiveTimeEntry(): Promise<TimeEntryRecord | null> {
  const response = await apiClient.get<ApiSuccessResponse<TimeEntryRecord | null>>('/time/active');
  return response.data.data;
}

/** Starts a running timer on a task. */
export async function startTimeEntry(
  taskId: string,
  payload: StartTimeEntryPayload = {},
): Promise<TimeEntryRecord> {
  const response = await apiClient.post<ApiSuccessResponse<TimeEntryRecord>>(
    `/tasks/${taskId}/time/start`,
    payload,
  );
  return response.data.data;
}

/** Stops a running timer and finalizes the time entry. */
export async function stopTimeEntry(
  timeEntryId: string,
  payload: StopTimeEntryPayload = {},
): Promise<TimeEntryRecord> {
  const response = await apiClient.post<ApiSuccessResponse<TimeEntryRecord>>(
    `/time/${timeEntryId}/stop`,
    payload,
  );
  return response.data.data;
}

/** Soft-deletes a time entry by id. */
export async function deleteTimeEntry(timeEntryId: string): Promise<TimeEntryRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<TimeEntryRecord>>(
    `/time/${timeEntryId}`,
  );
  return response.data.data;
}
