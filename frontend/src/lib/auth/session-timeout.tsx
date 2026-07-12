'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/design-system/typography';
import { clearAuthSession } from '@/lib/auth/access-token';
import { isAuthExplicitlyEnabled, redirectToLogin } from '@/lib/auth/config';

const SESSION_TIMEOUT_EVENT = 'agencyos:session-timeout';

/**
 * Dispatched when the API returns 401 Unauthorized and refresh cannot recover.
 * No-op when AUTH_ENABLED / NEXT_PUBLIC_AUTH_ENABLED is not explicitly true (demo mode).
 */
export function dispatchSessionTimeout(): void {
  if (!isAuthExplicitlyEnabled()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(SESSION_TIMEOUT_EVENT));
}

interface SessionTimeoutDialogProps {
  readonly onSignInAgain?: () => void;
}

/** Listens for session timeout events and prompts the user to sign in again (OIDC only). */
export function SessionTimeoutHandler({ onSignInAgain }: SessionTimeoutDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthExplicitlyEnabled()) {
      return;
    }

    const handleTimeout = (): void => {
      clearAuthSession();
      setOpen(true);
    };

    window.addEventListener(SESSION_TIMEOUT_EVENT, handleTimeout);
    return () => {
      window.removeEventListener(SESSION_TIMEOUT_EVENT, handleTimeout);
    };
  }, []);

  if (!isAuthExplicitlyEnabled() || !open) {
    return null;
  }

  const handleSignIn = (): void => {
    if (onSignInAgain) {
      onSignInAgain();
      return;
    }

    void redirectToLogin('/');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Clock className="size-5 text-muted-foreground" />
          </div>
          <SectionTitle id="session-timeout-title" className="text-base">
            Session expired
          </SectionTitle>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Your session has ended. Sign in again to continue working in AgencyOS.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={handleSignIn}>
            Sign in again
          </Button>
        </div>
      </div>
    </div>
  );
}
