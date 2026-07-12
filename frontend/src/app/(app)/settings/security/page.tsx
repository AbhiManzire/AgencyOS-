'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/design-system';
import {
  useCreatePersonalAccessToken,
  usePersonalAccessTokens,
  useRevokePersonalAccessToken,
  useSecuritySettings,
  useUpdateSecuritySettings,
} from '@/features/security/hooks/use-security';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can, PermissionRoute } from '@/lib/rbac';

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function SecuritySettingsContent() {
  const settingsQuery = useSecuritySettings();
  const tokensQuery = usePersonalAccessTokens();
  const updateMutation = useUpdateSecuritySettings();
  const createTokenMutation = useCreatePersonalAccessToken();
  const revokeTokenMutation = useRevokePersonalAccessToken();

  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [passwordRequireUppercase, setPasswordRequireUppercase] = useState(true);
  const [passwordRequireNumber, setPasswordRequireNumber] = useState(true);
  const [passwordRequireSpecial, setPasswordRequireSpecial] = useState(false);
  const [maxFailedLogins, setMaxFailedLogins] = useState(5);
  const [lockoutMinutes, setLockoutMinutes] = useState(15);
  const [tokenName, setTokenName] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }
    setSessionTimeoutMinutes(settingsQuery.data.sessionTimeoutMinutes);
    setPasswordMinLength(settingsQuery.data.passwordMinLength);
    setPasswordRequireUppercase(settingsQuery.data.passwordRequireUppercase);
    setPasswordRequireNumber(settingsQuery.data.passwordRequireNumber);
    setPasswordRequireSpecial(settingsQuery.data.passwordRequireSpecial);
    setMaxFailedLogins(settingsQuery.data.maxFailedLogins);
    setLockoutMinutes(settingsQuery.data.lockoutMinutes);
  }, [settingsQuery.data]);

  if (settingsQuery.isLoading || tokensQuery.isLoading) {
    return <LoadingState label="Loading security settings..." />;
  }

  if (settingsQuery.isError) {
    return (
      <ErrorState
        message={extractApiErrorMessage(settingsQuery.error)}
        action={
          <Button type="button" variant="outline" onClick={() => void settingsQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const tokens = tokensQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="Security"
        description="Session timeout, password policy, lockout settings, and personal access tokens."
      />

      {createdToken ? (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
        >
          <p className="font-medium">
            Copy your personal access token now. It will not be shown again.
          </p>
          <code className="mt-2 block break-all rounded bg-background px-2 py-1 font-mono text-xs">
            {createdToken}
          </code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => {
              setCreatedToken(null);
            }}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      <form
        className="mb-10 max-w-xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          updateMutation.mutate(
            {
              sessionTimeoutMinutes,
              passwordMinLength,
              passwordRequireUppercase,
              passwordRequireNumber,
              passwordRequireSpecial,
              maxFailedLogins,
              lockoutMinutes,
            },
            {
              onSuccess: () => {
                setMessage('Security settings saved.');
              },
              onError: (err) => {
                setMessage(extractApiErrorMessage(err));
              },
            },
          );
        }}
      >
        <h2 className="text-sm font-semibold">Policy</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="session-timeout" className="text-sm font-medium">
              Session timeout (minutes)
            </label>
            <Input
              id="session-timeout"
              type="number"
              min={5}
              value={sessionTimeoutMinutes}
              onChange={(event) => {
                setSessionTimeoutMinutes(Number(event.target.value));
              }}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password-min" className="text-sm font-medium">
              Password min length
            </label>
            <Input
              id="password-min"
              type="number"
              min={6}
              value={passwordMinLength}
              onChange={(event) => {
                setPasswordMinLength(Number(event.target.value));
              }}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="max-failed" className="text-sm font-medium">
              Max failed logins
            </label>
            <Input
              id="max-failed"
              type="number"
              min={1}
              value={maxFailedLogins}
              onChange={(event) => {
                setMaxFailedLogins(Number(event.target.value));
              }}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="lockout-minutes" className="text-sm font-medium">
              Lockout (minutes)
            </label>
            <Input
              id="lockout-minutes"
              type="number"
              min={1}
              value={lockoutMinutes}
              onChange={(event) => {
                setLockoutMinutes(Number(event.target.value));
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={passwordRequireUppercase}
              onCheckedChange={(next) => {
                setPasswordRequireUppercase(next === true);
              }}
            />
            Require uppercase letter
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={passwordRequireNumber}
              onCheckedChange={(next) => {
                setPasswordRequireNumber(next === true);
              }}
            />
            Require number
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={passwordRequireSpecial}
              onCheckedChange={(next) => {
                setPasswordRequireSpecial(next === true);
              }}
            />
            Require special character
          </label>
        </div>

        <Can permission="security.manage">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save security settings'}
          </Button>
        </Can>
      </form>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Personal access tokens</h2>

        <Can permission="security.manage">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage(null);
              createTokenMutation.mutate(
                { name: tokenName.trim() },
                {
                  onSuccess: (result) => {
                    setCreatedToken(result.token);
                    setTokenName('');
                    setMessage('Token created. Copy it now.');
                  },
                  onError: (err) => {
                    setMessage(extractApiErrorMessage(err));
                  },
                },
              );
            }}
          >
            <div className="space-y-1">
              <label htmlFor="token-name" className="text-sm font-medium">
                Token name
              </label>
              <Input
                id="token-name"
                value={tokenName}
                onChange={(event) => {
                  setTokenName(event.target.value);
                }}
                required
                className="min-w-[200px]"
              />
            </div>
            <Button
              type="submit"
              disabled={createTokenMutation.isPending || tokenName.trim().length === 0}
            >
              {createTokenMutation.isPending ? 'Creating…' : 'Create token'}
            </Button>
          </form>
        </Can>

        {tokensQuery.isError ? (
          <ErrorState
            message={extractApiErrorMessage(tokensQuery.error)}
            action={
              <Button type="button" variant="outline" onClick={() => void tokensQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : tokens.length === 0 ? (
          <EmptyState
            title="No tokens"
            description="Create a personal access token to get started."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">{token.name}</TableCell>
                  <TableCell className="font-mono text-xs">{token.tokenPrefix}</TableCell>
                  <TableCell className="text-xs">{formatDate(token.lastUsedAt)}</TableCell>
                  <TableCell className="text-xs">{formatDate(token.expiresAt)}</TableCell>
                  <TableCell className="text-xs">{formatDate(token.createdAt)}</TableCell>
                  <TableCell>
                    <Can permission="security.manage">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={revokeTokenMutation.isPending}
                        onClick={() => {
                          setMessage(null);
                          revokeTokenMutation.mutate(token.id, {
                            onSuccess: () => {
                              setMessage(`Token "${token.name}" revoked.`);
                            },
                            onError: (err) => {
                              setMessage(extractApiErrorMessage(err));
                            },
                          });
                        }}
                      >
                        Revoke
                      </Button>
                    </Can>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </>
  );
}

export default function SecuritySettingsPage() {
  return (
    <PermissionRoute permission="security.manage">
      <SecuritySettingsContent />
    </PermissionRoute>
  );
}
