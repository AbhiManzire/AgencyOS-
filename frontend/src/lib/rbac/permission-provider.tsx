'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useWorkspacePermissionsQuery } from '@/lib/rbac/use-workspace-permissions';
import type { PermissionContextValue } from '@/lib/rbac/types';

const PermissionContext = createContext<PermissionContextValue | null>(null);

interface PermissionProviderProps {
  readonly children: ReactNode;
}

/** Loads workspace permissions from the API and exposes them to the UI tree. */
export function PermissionProvider({ children }: PermissionProviderProps) {
  const { data, isLoading, isError } = useWorkspacePermissionsQuery();

  const permissions = useMemo(() => new Set(data?.permissions ?? []), [data?.permissions]);

  const hasPermission = useCallback(
    (permissionKey: string): boolean => {
      if (data?.isSuperAdmin) {
        return true;
      }

      return permissions.has(permissionKey);
    },
    [data?.isSuperAdmin, permissions],
  );

  const hasAllPermissions = useCallback(
    (permissionKeys: readonly string[]): boolean => {
      if (data?.isSuperAdmin) {
        return true;
      }

      return permissionKeys.every((key) => permissions.has(key));
    },
    [data?.isSuperAdmin, permissions],
  );

  const value = useMemo<PermissionContextValue>(
    () => ({
      permissions,
      roles: data?.roles ?? [],
      isSuperAdmin: data?.isSuperAdmin ?? false,
      isLoading,
      isError,
      hasPermission,
      hasAllPermissions,
    }),
    [
      data?.isSuperAdmin,
      data?.roles,
      hasAllPermissions,
      hasPermission,
      isError,
      isLoading,
      permissions,
    ],
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

/** Returns the permission context or throws when used outside PermissionProvider. */
export function usePermissionsContext(): PermissionContextValue {
  const context = useContext(PermissionContext);

  if (context === null) {
    throw new Error('usePermissionsContext must be used within PermissionProvider.');
  }

  return context;
}
