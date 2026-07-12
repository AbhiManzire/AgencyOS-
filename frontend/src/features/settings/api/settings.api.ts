import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  AdminSummary,
  CompanyProfile,
  CreateRoleInput,
  InviteUserInput,
  ListSettingsUsersParams,
  ListSettingsUsersResult,
  SetRolePermissionsInput,
  SettingsRoleDetail,
  SettingsRoleRecord,
  SettingsUserRecord,
  SystemSettings,
  UpdateCompanyProfileInput,
  UpdatePreferencesInput,
  UpdateRoleInput,
  UpdateSystemSettingsInput,
  UpdateUserProfileInput,
  UpdateWorkspaceSettingsInput,
  UserInvitationRecord,
  WorkspacePreferences,
  WorkspaceSettings,
} from '@/features/settings/api/settings.types';

function cleanParams(params: Record<string, string | number | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).length > 0) {
      out[key] = String(value);
    }
  }
  return out;
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const response = await apiClient.get<ApiSuccessResponse<CompanyProfile>>('/settings/company');
  return response.data.data;
}

export async function updateCompanyProfile(
  body: UpdateCompanyProfileInput,
): Promise<CompanyProfile> {
  const response = await apiClient.patch<ApiSuccessResponse<CompanyProfile>>(
    '/settings/company',
    body,
  );
  return response.data.data;
}

export async function getWorkspaceSettings(): Promise<WorkspaceSettings> {
  const response =
    await apiClient.get<ApiSuccessResponse<WorkspaceSettings>>('/settings/workspace');
  return response.data.data;
}

export async function updateWorkspaceSettings(
  body: UpdateWorkspaceSettingsInput,
): Promise<WorkspaceSettings> {
  const response = await apiClient.patch<ApiSuccessResponse<WorkspaceSettings>>(
    '/settings/workspace',
    body,
  );
  return response.data.data;
}

export async function archiveWorkspace(): Promise<WorkspaceSettings> {
  const response = await apiClient.post<ApiSuccessResponse<WorkspaceSettings>>(
    '/settings/workspace/archive',
  );
  return response.data.data;
}

export async function restoreWorkspace(): Promise<WorkspaceSettings> {
  const response = await apiClient.post<ApiSuccessResponse<WorkspaceSettings>>(
    '/settings/workspace/restore',
  );
  return response.data.data;
}

export async function getPreferences(): Promise<WorkspacePreferences> {
  const response =
    await apiClient.get<ApiSuccessResponse<WorkspacePreferences>>('/settings/preferences');
  return response.data.data;
}

export async function updatePreferences(
  body: UpdatePreferencesInput,
): Promise<WorkspacePreferences> {
  const response = await apiClient.patch<ApiSuccessResponse<WorkspacePreferences>>(
    '/settings/preferences',
    body,
  );
  return response.data.data;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const response = await apiClient.get<ApiSuccessResponse<SystemSettings>>('/settings/system');
  return response.data.data;
}

export async function updateSystemSettings(
  body: UpdateSystemSettingsInput,
): Promise<SystemSettings> {
  const response = await apiClient.patch<ApiSuccessResponse<SystemSettings>>(
    '/settings/system',
    body,
  );
  return response.data.data;
}

export async function listSettingsUsers(
  params: ListSettingsUsersParams = {},
): Promise<ListSettingsUsersResult> {
  const response = await apiClient.get<ApiSuccessResponse<ListSettingsUsersResult>>(
    '/settings/users',
    {
      params: cleanParams({
        search: params.search,
        status: params.status,
        skip: params.skip,
        take: params.take,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
      }),
    },
  );
  return response.data.data;
}

export async function inviteUser(body: InviteUserInput): Promise<UserInvitationRecord> {
  const response = await apiClient.post<ApiSuccessResponse<UserInvitationRecord>>(
    '/settings/users/invite',
    body,
  );
  return response.data.data;
}

export async function updateUserProfile(
  userId: string,
  body: UpdateUserProfileInput,
): Promise<SettingsUserRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<SettingsUserRecord>>(
    `/settings/users/${userId}`,
    body,
  );
  return response.data.data;
}

export async function deactivateUser(userId: string): Promise<SettingsUserRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SettingsUserRecord>>(
    `/settings/users/${userId}/deactivate`,
  );
  return response.data.data;
}

export async function reactivateUser(userId: string): Promise<SettingsUserRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SettingsUserRecord>>(
    `/settings/users/${userId}/reactivate`,
  );
  return response.data.data;
}

export async function archiveUser(userId: string): Promise<SettingsUserRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SettingsUserRecord>>(
    `/settings/users/${userId}/archive`,
  );
  return response.data.data;
}

export async function restoreUser(userId: string): Promise<SettingsUserRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SettingsUserRecord>>(
    `/settings/users/${userId}/restore`,
  );
  return response.data.data;
}

export async function unlockUser(userId: string): Promise<SettingsUserRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SettingsUserRecord>>(
    `/settings/users/${userId}/unlock`,
  );
  return response.data.data;
}

export async function resetUserPassword(userId: string): Promise<{ readonly emailReady: boolean }> {
  const response = await apiClient.post<ApiSuccessResponse<{ readonly emailReady: boolean }>>(
    `/settings/users/${userId}/reset-password`,
  );
  return response.data.data;
}

export async function assignUserRole(userId: string, roleId: string): Promise<SettingsUserRecord> {
  const response = await apiClient.post<ApiSuccessResponse<SettingsUserRecord>>(
    `/settings/users/${userId}/roles`,
    { roleId },
  );
  return response.data.data;
}

export async function revokeUserRole(userId: string, roleId: string): Promise<SettingsUserRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<SettingsUserRecord>>(
    `/settings/users/${userId}/roles/${roleId}`,
  );
  return response.data.data;
}

export async function listSettingsRoles(): Promise<readonly SettingsRoleRecord[]> {
  const response =
    await apiClient.get<ApiSuccessResponse<{ items: readonly SettingsRoleRecord[] }>>(
      '/settings/roles',
    );
  return response.data.data.items;
}

export async function getSettingsRole(roleId: string): Promise<SettingsRoleDetail> {
  const response = await apiClient.get<ApiSuccessResponse<SettingsRoleDetail>>(
    `/settings/roles/${roleId}`,
  );
  return response.data.data;
}

export async function createSettingsRole(body: CreateRoleInput): Promise<SettingsRoleDetail> {
  const response = await apiClient.post<ApiSuccessResponse<SettingsRoleDetail>>(
    '/settings/roles',
    body,
  );
  return response.data.data;
}

export async function updateSettingsRole(
  roleId: string,
  body: UpdateRoleInput,
): Promise<SettingsRoleDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<SettingsRoleDetail>>(
    `/settings/roles/${roleId}`,
    body,
  );
  return response.data.data;
}

export async function deleteSettingsRole(roleId: string): Promise<void> {
  await apiClient.delete(`/settings/roles/${roleId}`);
}

export async function setRolePermissions(
  roleId: string,
  body: SetRolePermissionsInput,
): Promise<SettingsRoleDetail> {
  const response = await apiClient.put<ApiSuccessResponse<SettingsRoleDetail>>(
    `/settings/roles/${roleId}/permissions`,
    body,
  );
  return response.data.data;
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const response = await apiClient.get<ApiSuccessResponse<AdminSummary>>(
    '/dashboard/admin-summary',
  );
  return response.data.data;
}
