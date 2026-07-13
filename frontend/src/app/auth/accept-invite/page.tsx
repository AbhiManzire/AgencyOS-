'use client';

import { Suspense, useMemo, useState, type SyntheticEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState, PageContainer } from '@/design-system';
import { SectionTitle } from '@/design-system/typography';
import { AUTH_CONFIG, isAuthExplicitlyEnabled, redirectToLogin } from '@/lib/auth/config';

interface AcceptInvitationResult {
  readonly userId: string;
  readonly email: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly createdUser: boolean;
}

/** Accepts a workspace invitation using the token from the invite email. */
export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <PageContainer size="sm">
          <LoadingState label="Loading invitation..." />
        </PageContainer>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (token.length < 32) {
      setError('Invitation token is missing or invalid.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${AUTH_CONFIG.apiUrl}/invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          displayName: displayName.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        data?: AcceptInvitationResult;
        error?: { message?: string };
      };

      if (!response.ok || payload.success === false) {
        throw new Error(payload.error?.message ?? 'Unable to accept invitation.');
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept invitation.');
    } finally {
      setSubmitting(false);
    }
  }

  if (token.length === 0) {
    return (
      <PageContainer size="sm">
        <div className="mx-auto mt-24 max-w-md space-y-3 text-center">
          <SectionTitle>Invalid invitation</SectionTitle>
          <p className="text-sm text-muted-foreground">
            This link is missing an invitation token. Ask your admin to resend the invite.
          </p>
        </div>
      </PageContainer>
    );
  }

  if (done) {
    return (
      <PageContainer size="sm">
        <div className="mx-auto mt-24 max-w-md space-y-4 text-center">
          <SectionTitle>Invitation accepted</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Your workspace membership is ready. Sign in with the invited email to continue.
          </p>
          <Button
            type="button"
            onClick={() => {
              if (isAuthExplicitlyEnabled()) {
                void redirectToLogin('/');
                return;
              }
              router.replace('/');
            }}
          >
            Continue to sign in
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="sm">
      <form
        className="mx-auto mt-24 max-w-md space-y-4 rounded-lg border border-border p-6"
        onSubmit={(event) => {
          void onSubmit(event);
        }}
      >
        <SectionTitle>Accept invitation</SectionTitle>
        <p className="text-sm text-muted-foreground">
          Confirm your details to join the workspace. You will sign in with this email afterward.
        </p>

        <div className="space-y-1">
          <label htmlFor="invite-first-name" className="text-sm font-medium">
            First name
          </label>
          <Input
            id="invite-first-name"
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
            }}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="invite-last-name" className="text-sm font-medium">
            Last name
          </label>
          <Input
            id="invite-last-name"
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value);
            }}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="invite-display-name" className="text-sm font-medium">
            Display name
          </label>
          <Input
            id="invite-display-name"
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
            }}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Accepting…' : 'Accept invitation'}
        </Button>
      </form>
    </PageContainer>
  );
}
