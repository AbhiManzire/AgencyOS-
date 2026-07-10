import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CompanyProfile,
  SettingsRoleDetail,
  SettingsRoleRecord,
  SettingsUserRecord,
  WorkspacePreferences,
  WorkspaceSettings,
} from '@/features/settings/api/settings.types';

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const response = await apiClient.get<ApiSuccessResponse<CompanyProfile>>('/settings/company');
  return response.data.data;
}

export async function updateCompanyProfile(body: {
  name?: string;
  legalName?: string | null;
}): Promise<CompanyProfile> {
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

export async function updateWorkspaceSettings(body: { name?: string }): Promise<WorkspaceSettings> {
  const response = await apiClient.patch<ApiSuccessResponse<WorkspaceSettings>>(
    '/settings/workspace',
    body,
  );
  return response.data.data;
}

export async function getPreferences(): Promise<WorkspacePreferences> {
  const response =
    await apiClient.get<ApiSuccessResponse<WorkspacePreferences>>('/settings/preferences');
  return response.data.data;
}

export async function updatePreferences(body: {
  timezone?: string;
  currency?: string;
}): Promise<WorkspacePreferences> {
  const response = await apiClient.patch<ApiSuccessResponse<WorkspacePreferences>>(
    '/settings/preferences',
    body,
  );
  return response.data.data;
}

export async function listSettingsUsers(): Promise<readonly SettingsUserRecord[]> {
  const response =
    await apiClient.get<ApiSuccessResponse<{ items: readonly SettingsUserRecord[] }>>(
      '/settings/users',
    );
  return response.data.data.items;
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
