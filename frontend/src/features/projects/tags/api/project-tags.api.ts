import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';

export interface ProjectTagRecord {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: string;
}

export interface AssignProjectTagPayload {
  readonly name: string;
  readonly colorToken?: string | null;
}

/** Lists tags assigned to a project. */
export async function listProjectTags(projectId: string): Promise<readonly ProjectTagRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<ProjectTagRecord[]>>(
    `/projects/${projectId}/tags`,
  );
  return response.data.data;
}

/** Assigns a tag to a project by name (find-or-create). */
export async function assignProjectTag(
  projectId: string,
  payload: AssignProjectTagPayload,
): Promise<ProjectTagRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ProjectTagRecord>>(
    `/projects/${projectId}/tags`,
    payload,
  );
  return response.data.data;
}

/** Unassigns a tag from a project. */
export async function unassignProjectTag(projectId: string, tagId: string): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/tags/${tagId}`);
}
