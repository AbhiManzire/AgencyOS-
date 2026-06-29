import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateProjectMemberPayload,
  ListProjectMembersResult,
  ProjectMemberRecord,
  UpdateProjectMemberPayload,
  WorkspaceUserOption,
} from '@/features/projects/members/api/member.types';

/** Fetches members for a project. */
export async function listProjectMembers(projectId: string): Promise<ListProjectMembersResult> {
  const response = await apiClient.get<ApiSuccessResponse<ProjectMemberRecord[]>>(
    `/projects/${projectId}/members`,
  );

  const availableUsers = (response.data.meta?.availableUsers ?? []) as WorkspaceUserOption[];

  return {
    members: response.data.data,
    availableUsers,
  };
}

/** Adds a member to a project. */
export async function createProjectMember(
  projectId: string,
  payload: CreateProjectMemberPayload,
): Promise<ProjectMemberRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ProjectMemberRecord>>(
    `/projects/${projectId}/members`,
    payload,
  );
  return response.data.data;
}

/** Updates a project member. */
export async function updateProjectMember(
  projectId: string,
  memberId: string,
  payload: UpdateProjectMemberPayload,
): Promise<ProjectMemberRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<ProjectMemberRecord>>(
    `/projects/${projectId}/members/${memberId}`,
    payload,
  );
  return response.data.data;
}

/** Removes a member from a project. */
export async function deleteProjectMember(
  projectId: string,
  memberId: string,
): Promise<ProjectMemberRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<ProjectMemberRecord>>(
    `/projects/${projectId}/members/${memberId}`,
  );
  return response.data.data;
}
