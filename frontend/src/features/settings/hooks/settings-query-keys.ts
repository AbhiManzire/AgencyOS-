export const settingsQueryKeys = {
  all: ['settings'] as const,
  company: () => [...settingsQueryKeys.all, 'company'] as const,
  workspace: () => [...settingsQueryKeys.all, 'workspace'] as const,
  preferences: () => [...settingsQueryKeys.all, 'preferences'] as const,
  users: () => [...settingsQueryKeys.all, 'users'] as const,
  roles: () => [...settingsQueryKeys.all, 'roles'] as const,
  role: (roleId: string) => [...settingsQueryKeys.all, 'roles', roleId] as const,
};
