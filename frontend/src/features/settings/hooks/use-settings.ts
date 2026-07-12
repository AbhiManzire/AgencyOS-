'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveUser,
  archiveWorkspace,
  assignUserRole,
  createSettingsRole,
  deactivateUser,
  deleteSettingsRole,
  getAdminSummary,
  getCompanyProfile,
  getPreferences,
  getSettingsRole,
  getSystemSettings,
  getWorkspaceSettings,
  inviteUser,
  listSettingsRoles,
  listSettingsUsers,
  reactivateUser,
  resetUserPassword,
  restoreUser,
  restoreWorkspace,
  revokeUserRole,
  setRolePermissions,
  unlockUser,
  updateCompanyProfile,
  updatePreferences,
  updateSettingsRole,
  updateSystemSettings,
  updateUserProfile,
  updateWorkspaceSettings,
} from '@/features/settings/api/settings.api';
import type {
  CreateRoleInput,
  InviteUserInput,
  ListSettingsUsersParams,
  SetRolePermissionsInput,
  UpdateCompanyProfileInput,
  UpdatePreferencesInput,
  UpdateRoleInput,
  UpdateSystemSettingsInput,
  UpdateUserProfileInput,
  UpdateWorkspaceSettingsInput,
} from '@/features/settings/api/settings.types';
import { settingsQueryKeys } from '@/features/settings/hooks/settings-query-keys';

const STALE_TIME = 60_000;

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: [...settingsQueryKeys.all, 'users'] });
  void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.adminSummary() });
}

export function useCompanyProfile() {
  return useQuery({
    queryKey: settingsQueryKeys.company(),
    queryFn: getCompanyProfile,
    staleTime: STALE_TIME,
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateCompanyProfileInput) => updateCompanyProfile(body),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.company(), data);
    },
  });
}

export function useWorkspaceSettings() {
  return useQuery({
    queryKey: settingsQueryKeys.workspace(),
    queryFn: getWorkspaceSettings,
    staleTime: STALE_TIME,
  });
}

export function useUpdateWorkspaceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateWorkspaceSettingsInput) => updateWorkspaceSettings(body),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.workspace(), data);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.preferences() });
    },
  });
}

export function useArchiveWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveWorkspace,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.workspace(), data);
    },
  });
}

export function useRestoreWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreWorkspace,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.workspace(), data);
    },
  });
}

export function usePreferences() {
  return useQuery({
    queryKey: settingsQueryKeys.preferences(),
    queryFn: getPreferences,
    staleTime: STALE_TIME,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePreferencesInput) => updatePreferences(body),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.preferences(), data);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.workspace() });
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.system() });
    },
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: settingsQueryKeys.system(),
    queryFn: getSystemSettings,
    staleTime: STALE_TIME,
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSystemSettingsInput) => updateSystemSettings(body),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.system(), data);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.preferences() });
    },
  });
}

export function useSettingsUsers(params: ListSettingsUsersParams = {}) {
  return useQuery({
    queryKey: settingsQueryKeys.users(params),
    queryFn: () => listSettingsUsers(params),
    staleTime: STALE_TIME,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InviteUserInput) => inviteUser(body),
    onSuccess: () => {
      invalidateUsers(queryClient);
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: UpdateUserProfileInput }) =>
      updateUserProfile(userId, body),
    onSuccess: () => {
      invalidateUsers(queryClient);
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deactivateUser(userId),
    onSuccess: () => {
      invalidateUsers(queryClient);
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => reactivateUser(userId),
    onSuccess: () => {
      invalidateUsers(queryClient);
    },
  });
}

export function useArchiveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => archiveUser(userId),
    onSuccess: () => {
      invalidateUsers(queryClient);
    },
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => restoreUser(userId),
    onSuccess: () => {
      invalidateUsers(queryClient);
    },
  });
}

export function useUnlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unlockUser(userId),
    onSuccess: () => {
      invalidateUsers(queryClient);
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: (userId: string) => resetUserPassword(userId),
  });
}

export function useSettingsRoles() {
  return useQuery({
    queryKey: settingsQueryKeys.roles(),
    queryFn: listSettingsRoles,
    staleTime: STALE_TIME,
  });
}

export function useSettingsRole(roleId: string) {
  return useQuery({
    queryKey: settingsQueryKeys.role(roleId),
    queryFn: () => getSettingsRole(roleId),
    enabled: roleId.length > 0,
    staleTime: STALE_TIME,
  });
}

export function useCreateSettingsRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRoleInput) => createSettingsRole(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.roles() });
    },
  });
}

export function useUpdateSettingsRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, body }: { roleId: string; body: UpdateRoleInput }) =>
      updateSettingsRole(roleId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.role(data.id), data);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.roles() });
    },
  });
}

export function useDeleteSettingsRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => deleteSettingsRole(roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.roles() });
    },
  });
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, body }: { roleId: string; body: SetRolePermissionsInput }) =>
      setRolePermissions(roleId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.role(data.id), data);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.roles() });
    },
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      assignUserRole(userId, roleId),
    onSuccess: () => {
      invalidateUsers(queryClient);
    },
  });
}

export function useRevokeUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      revokeUserRole(userId, roleId),
    onSuccess: () => {
      invalidateUsers(queryClient);
    },
  });
}

export function useAdminSummary() {
  return useQuery({
    queryKey: settingsQueryKeys.adminSummary(),
    queryFn: getAdminSummary,
    staleTime: STALE_TIME,
  });
}
