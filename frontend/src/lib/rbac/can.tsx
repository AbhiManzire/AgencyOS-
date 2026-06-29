'use client';

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { usePermission } from '@/lib/rbac/use-permission';
import type { PermissionCheckMode } from '@/lib/rbac/types';

interface CanProps {
  readonly permission: string | readonly string[];
  readonly mode?: PermissionCheckMode;
  readonly match?: 'all' | 'any';
  readonly fallback?: ReactNode;
  readonly children: ReactNode;
}

/** Conditionally renders or disables children based on API-loaded permissions. */
export function Can({
  permission,
  mode = 'hide',
  match = 'all',
  fallback = null,
  children,
}: CanProps) {
  const { allowed, isLoading } = usePermission(permission, { match });

  if (isLoading) {
    return null;
  }

  if (allowed) {
    return children;
  }

  if (mode === 'disable' && isValidElement(children)) {
    return cloneElement(
      children as ReactElement<{ disabled?: boolean; 'aria-disabled'?: boolean }>,
      {
        disabled: true,
        'aria-disabled': true,
      },
    );
  }

  return fallback;
}
