'use client';

import { useEffect } from 'react';
import { LoadingState, PageContainer } from '@/design-system';
import { logout } from '@/lib/auth/oidc';

/** Clears the local OIDC session and ends the Keycloak SSO session. */
export default function AuthLogoutPage() {
  useEffect(() => {
    logout();
  }, []);

  return (
    <PageContainer size="sm">
      <LoadingState label="Signing out..." />
    </PageContainer>
  );
}
