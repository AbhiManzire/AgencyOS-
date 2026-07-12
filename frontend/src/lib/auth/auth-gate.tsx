'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingState, PageContainer } from '@/design-system';
import { SectionTitle } from '@/design-system/typography';
import { hasAuthSession } from '@/lib/auth/access-token';
import { isAuthExplicitlyEnabled, redirectToLogin } from '@/lib/auth/config';
import { ensureFreshAccessToken } from '@/lib/auth/oidc';

interface AuthGateProps {
  readonly children: ReactNode;
}

/**
 * Production route gate: requires a stored access token before rendering the app shell.
 * When AUTH_ENABLED / NEXT_PUBLIC_AUTH_ENABLED is not explicitly `true`, immediately
 * allows the app (demo header identity — no Keycloak).
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

    void (async () => {
      if (!hasAuthSession()) {
        setAuthenticated(false);
        setReady(true);
        return;
      }

      const token = await ensureFreshAccessToken();
      setAuthenticated(token !== null && token.length > 0);
      setReady(true);
    })();
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
              void redirectToLogin('/');
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
