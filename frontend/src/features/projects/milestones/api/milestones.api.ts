import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateProjectMilestonePayload,
  ListProjectMilestonesResult,
  ProjectMilestoneRecord,
  UpdateProjectMilestonePayload,
  WorkspaceOwnerOption,
} from '@/features/projects/milestones/api/milestone.types';

/** Fetches milestones for a project. */
export async function listProjectMilestones(
  projectId: string,
): Promise<ListProjectMilestonesResult> {
  const response = await apiClient.get<ApiSuccessResponse<ProjectMilestoneRecord[]>>(
    `/projects/${projectId}/milestones`,
  );

  const availableOwners = (response.data.meta?.availableOwners ?? []) as WorkspaceOwnerOption[];

  return {
    milestones: response.data.data,
    availableOwners,
  };
}

/** Creates a project milestone. */
export async function createProjectMilestone(
  projectId: string,
  payload: CreateProjectMilestonePayload,
): Promise<ProjectMilestoneRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ProjectMilestoneRecord>>(
    `/projects/${projectId}/milestones`,
    payload,
  );
  return response.data.data;
}

/** Updates a project milestone. */
export async function updateProjectMilestone(
  projectId: string,
  milestoneId: string,
  payload: UpdateProjectMilestonePayload,
): Promise<ProjectMilestoneRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<ProjectMilestoneRecord>>(
    `/projects/${projectId}/milestones/${milestoneId}`,
    payload,
  );
  return response.data.data;
}

/** Deletes a project milestone. */
export async function deleteProjectMilestone(
  projectId: string,
  milestoneId: string,
): Promise<ProjectMilestoneRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<ProjectMilestoneRecord>>(
    `/projects/${projectId}/milestones/${milestoneId}`,
  );
  return response.data.data;
}
