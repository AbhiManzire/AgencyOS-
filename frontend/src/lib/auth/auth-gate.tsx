'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingState, PageContainer } from '@/design-system';
import { SectionTitle } from '@/design-system/typography';
import { getAccessToken } from '@/lib/auth/access-token';
import { getKeycloakLoginUrl } from '@/lib/auth/config';

interface AuthGateProps {
  readonly children: ReactNode;
}

/**
 * Auth is on only when explicitly enabled. Either flag set to `false` bypasses the gate.
 * Prefer `NEXT_PUBLIC_AUTH_ENABLED` for the client bundle; `AUTH_ENABLED` is checked for parity.
 */
function isAuthExplicitlyEnabled(): boolean {
  if (process.env.AUTH_ENABLED === 'false' || process.env.NEXT_PUBLIC_AUTH_ENABLED === 'false') {
    return false;
  }

  return process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true' || process.env.AUTH_ENABLED === 'true';
}

/**
 * Production route gate: requires a stored access token before rendering the app shell.
 * Bypassed when AUTH_ENABLED / NEXT_PUBLIC_AUTH_ENABLED is not explicitly true.
 */
export function AuthGate({ children }: AuthGateProps) {
  if (!isAuthExplicitlyEnabled()) {
    return children;
  }

  return <EnforcedAuthGate>{children}</EnforcedAuthGate>;
}

function EnforcedAuthGate({ children }: AuthGateProps) {
  const allowUnauthenticatedShell =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_ALLOW_DEV_IDENTITY_HEADERS === 'true';

  const [ready, setReady] = useState(allowUnauthenticatedShell);
  const [authenticated, setAuthenticated] = useState(allowUnauthenticatedShell);

  useEffect(() => {
    if (allowUnauthenticatedShell) {
      return;
    }

    const token = getAccessToken();
    setAuthenticated(token !== null && token.length > 0);
    setReady(true);
  }, [allowUnauthenticatedShell]);

  if (!ready) {
    return (
      <PageContainer size="sm">
        <LoadingState label="Checking session..." />
      </PageContainer>
    );
  }

  if (!authenticated) {
    return (
      <PageContainer size="sm">
        <div className="mx-auto mt-24 max-w-md space-y-4 text-center">
          <SectionTitle>Sign in required</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Authenticate with Keycloak to access AgencyOS.
          </p>
          <Button
            type="button"
            onClick={() => {
              window.location.assign(getKeycloakLoginUrl());
            }}
          >
            Sign in
          </Button>
        </div>
      </PageContainer>
    );
  }

  return children;
}
