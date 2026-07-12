'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState, PageContainer } from '@/design-system';
import { SectionTitle } from '@/design-system/typography';
import { Button } from '@/components/ui/button';
import { consumeOidcReturnTo, redirectToLogin } from '@/lib/auth/config';
import { exchangeAuthorizationCode } from '@/lib/auth/oidc';

/** Completes Keycloak authorization-code + PKCE exchange and restores the app session. */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const oidcError = params.get('error');
    const oidcErrorDescription = params.get('error_description');

    if (oidcError) {
      setError(oidcErrorDescription ?? oidcError);
      return;
    }

    if (!code) {
      setError('Missing authorization code');
      return;
    }

    void (async () => {
      try {
        await exchangeAuthorizationCode(code);
        const returnTo = consumeOidcReturnTo();
        router.replace(returnTo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign-in failed');
      }
    })();
  }, [router]);

  if (error) {
    return (
      <PageContainer size="sm">
        <div className="mx-auto mt-24 max-w-md space-y-4 text-center">
          <SectionTitle>Sign-in failed</SectionTitle>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            type="button"
            onClick={() => {
              void redirectToLogin('/');
            }}
          >
            Try again
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="sm">
      <LoadingState label="Completing sign-in..." />
    </PageContainer>
  );
}
