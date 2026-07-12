'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState, PageContainer } from '@/design-system';
import { isAuthExplicitlyEnabled } from '@/lib/auth/config';
import { logout } from '@/lib/auth/oidc';

/** Clears the local OIDC session and ends the Keycloak SSO session (OIDC mode only). */
export default function AuthLogoutPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthExplicitlyEnabled()) {
      router.replace('/');
      return;
    }

    logout();
  }, [router]);

  return (
    <PageContainer size="sm">
      <LoadingState label="Signing out..." />
    </PageContainer>
  );
}
