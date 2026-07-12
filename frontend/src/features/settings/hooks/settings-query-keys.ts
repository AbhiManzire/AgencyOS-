import type { ListSettingsUsersParams } from '@/features/settings/api/settings.types';

export const settingsQueryKeys = {
  all: ['settings'] as const,
  company: () => [...settingsQueryKeys.all, 'company'] as const,
  workspace: () => [...settingsQueryKeys.all, 'workspace'] as const,
  preferences: () => [...settingsQueryKeys.all, 'preferences'] as const,
  system: () => [...settingsQueryKeys.all, 'system'] as const,
  users: (params?: ListSettingsUsersParams) =>
    [...settingsQueryKeys.all, 'users', params ?? {}] as const,
  roles: () => [...settingsQueryKeys.all, 'roles'] as const,
  role: (roleId: string) => [...settingsQueryKeys.all, 'roles', roleId] as const,
  adminSummary: () => [...settingsQueryKeys.all, 'admin-summary'] as const,
};
