'use client';

import { usePermissionsContext } from '@/lib/rbac/permission-provider';

interface UsePermissionOptions {
  readonly match?: 'all' | 'any';
}

interface UsePermissionResult {
  readonly allowed: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

/** Checks whether the current user has one or more permission keys loaded from the API. */
export function usePermission(
  permissionKeys: string | readonly string[],
  options: UsePermissionOptions = {},
): UsePermissionResult {
  const { hasPermission, hasAllPermissions, isLoading, isError, isSuperAdmin } =
    usePermissionsContext();

  const keys = typeof permissionKeys === 'string' ? [permissionKeys] : permissionKeys;
  const match = options.match ?? 'all';

  const allowed =
    isSuperAdmin ||
    (match === 'all' ? hasAllPermissions(keys) : keys.some((key) => hasPermission(key)));

  return {
    allowed,
    isLoading,
    isError,
  };
}
