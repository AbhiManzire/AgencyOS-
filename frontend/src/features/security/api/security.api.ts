import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreatePersonalAccessTokenInput,
  CreatePersonalAccessTokenResult,
  PersonalAccessTokenRecord,
  SecuritySettings,
  UpdateSecuritySettingsInput,
} from '@/features/security/api/security.types';

export async function getSecuritySettings(): Promise<SecuritySettings> {
  const response = await apiClient.get<ApiSuccessResponse<SecuritySettings>>('/security/settings');
  return response.data.data;
}

export async function updateSecuritySettings(
  body: UpdateSecuritySettingsInput,
): Promise<SecuritySettings> {
  const response = await apiClient.patch<ApiSuccessResponse<SecuritySettings>>(
    '/security/settings',
    body,
  );
  return response.data.data;
}

export async function listPersonalAccessTokens(): Promise<readonly PersonalAccessTokenRecord[]> {
  const response =
    await apiClient.get<ApiSuccessResponse<{ items: readonly PersonalAccessTokenRecord[] }>>(
      '/security/tokens',
    );
  return response.data.data.items;
}

export async function createPersonalAccessToken(
  body: CreatePersonalAccessTokenInput,
): Promise<CreatePersonalAccessTokenResult> {
  const response = await apiClient.post<ApiSuccessResponse<CreatePersonalAccessTokenResult>>(
    '/security/tokens',
    body,
  );
  return response.data.data;
}

export async function revokePersonalAccessToken(id: string): Promise<void> {
  await apiClient.delete(`/security/tokens/${id}`);
}
