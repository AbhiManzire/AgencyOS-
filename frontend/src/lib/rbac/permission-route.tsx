'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, PageContainer } from '@/design-system';
import { Can } from '@/lib/rbac/can';
import { usePermission } from '@/lib/rbac/use-permission';

interface PermissionRouteProps {
  readonly permission: string | readonly string[];
  readonly match?: 'all' | 'any';
  readonly children: ReactNode;
}

/** Protects a route segment until workspace permissions are loaded and satisfied. */
export function PermissionRoute({ permission, match = 'all', children }: PermissionRouteProps) {
  const { allowed, isLoading, isError } = usePermission(permission, { match });

  if (isLoading) {
    return (
      <PageContainer size="lg">
        <LoadingState label="Checking permissions..." />
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer size="lg">
        <ErrorState message="Unable to load permissions for this workspace." />
      </PageContainer>
    );
  }

  if (!allowed) {
    return (
      <PageContainer size="lg">
        <ErrorState
          message="You do not have permission to access this page."
          action={
            <Button variant="outline" asChild>
              <a href="/">Back to Dashboard</a>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return children;
}

/** Utility wrapper for nav items that should be hidden without permission. */
export function CanNavItem({
  permission,
  match = 'all',
  children,
}: {
  readonly permission?: string | readonly string[];
  readonly match?: 'all' | 'any';
  readonly children: ReactNode;
}) {
  if (permission === undefined) {
    return children;
  }

  return (
    <Can permission={permission} match={match} mode="hide">
      {children}
    </Can>
  );
}
