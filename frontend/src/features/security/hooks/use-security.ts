'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPersonalAccessToken,
  getSecuritySettings,
  listPersonalAccessTokens,
  revokePersonalAccessToken,
  updateSecuritySettings,
} from '@/features/security/api/security.api';
import type {
  CreatePersonalAccessTokenInput,
  UpdateSecuritySettingsInput,
} from '@/features/security/api/security.types';
import { securityQueryKeys } from '@/features/security/hooks/security-query-keys';

const STALE_TIME = 60_000;

export function useSecuritySettings() {
  return useQuery({
    queryKey: securityQueryKeys.settings(),
    queryFn: getSecuritySettings,
    staleTime: STALE_TIME,
  });
}

export function useUpdateSecuritySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSecuritySettingsInput) => updateSecuritySettings(body),
    onSuccess: (data) => {
      queryClient.setQueryData(securityQueryKeys.settings(), data);
    },
  });
}

export function usePersonalAccessTokens() {
  return useQuery({
    queryKey: securityQueryKeys.tokens(),
    queryFn: listPersonalAccessTokens,
    staleTime: STALE_TIME,
  });
}

export function useCreatePersonalAccessToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePersonalAccessTokenInput) => createPersonalAccessToken(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityQueryKeys.tokens() });
    },
  });
}

export function useRevokePersonalAccessToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokePersonalAccessToken(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityQueryKeys.tokens() });
    },
  });
}
