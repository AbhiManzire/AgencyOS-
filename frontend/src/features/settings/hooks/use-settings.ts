'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignUserRole,
  getCompanyProfile,
  getPreferences,
  getSettingsRole,
  getWorkspaceSettings,
  listSettingsRoles,
  listSettingsUsers,
  revokeUserRole,
  updateCompanyProfile,
  updatePreferences,
  updateWorkspaceSettings,
} from '@/features/settings/api/settings.api';
import { settingsQueryKeys } from '@/features/settings/hooks/settings-query-keys';

export function useCompanyProfile() {
  return useQuery({
    queryKey: settingsQueryKeys.company(),
    queryFn: getCompanyProfile,
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompanyProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.company(), data);
    },
  });
}

export function useWorkspaceSettings() {
  return useQuery({
    queryKey: settingsQueryKeys.workspace(),
    queryFn: getWorkspaceSettings,
  });
}

export function useUpdateWorkspaceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWorkspaceSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.workspace(), data);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.preferences() });
    },
  });
}

export function usePreferences() {
  return useQuery({
    queryKey: settingsQueryKeys.preferences(),
    queryFn: getPreferences,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.preferences(), data);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.workspace() });
    },
  });
}

export function useSettingsUsers() {
  return useQuery({
    queryKey: settingsQueryKeys.users(),
    queryFn: listSettingsUsers,
  });
}

export function useSettingsRoles() {
  return useQuery({
    queryKey: settingsQueryKeys.roles(),
    queryFn: listSettingsRoles,
  });
}

export function useSettingsRole(roleId: string) {
  return useQuery({
    queryKey: settingsQueryKeys.role(roleId),
    queryFn: () => getSettingsRole(roleId),
    enabled: roleId.length > 0,
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      assignUserRole(userId, roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.users() });
    },
  });
}

export function useRevokeUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      revokeUserRole(userId, roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.users() });
    },
  });
}
