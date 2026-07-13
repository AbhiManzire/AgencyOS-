'use client';

import Link from 'next/link';
import { Loader2, RefreshCw, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import { Caption } from '@/design-system/typography';
import type { IntegrationConnectionRecord } from '@/features/integrations/api/integration.types';
import { INTEGRATION_CATEGORY_LABELS } from '@/features/integrations/api/integration.types';
import { ConnectionStatusBadge } from '@/features/integrations/components/connection-status-badge';
import {
  useDisconnectIntegration,
  useSyncIntegration,
} from '@/features/integrations/hooks/use-integration-mutations';
import {
  useIntegrationConnection,
  useIntegrationConnectionHealth,
} from '@/features/integrations/hooks/use-integrations';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

interface ConnectionDetailDrawerProps {
  readonly open: boolean;
  readonly connectionId: string | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConnect: (connection: IntegrationConnectionRecord) => void;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString();
}

export function ConnectionDetailDrawer({
  open,
  connectionId,
  onOpenChange,
  onConnect,
}: ConnectionDetailDrawerProps) {
  const { showToast } = useToast();
  const connectionQuery = useIntegrationConnection(connectionId ?? '', {
    enabled: open && Boolean(connectionId),
  });
  const healthQuery = useIntegrationConnectionHealth(connectionId ?? '', {
    enabled: open && Boolean(connectionId),
  });
  const disconnectMutation = useDisconnectIntegration();
  const syncMutation = useSyncIntegration();

  const connection = connectionQuery.data;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <div className="space-y-6">
          <div className="space-y-1">
            <SectionTitle>Connection details</SectionTitle>
            {connection ? (
              <Caption>
                {connection.providerKey} · {INTEGRATION_CATEGORY_LABELS[connection.category]}
              </Caption>
            ) : null}
          </div>

          {connectionQuery.error ? (
            <ErrorState
              message={extractApiErrorMessage(connectionQuery.error)}
              action={
                <Button variant="outline" onClick={() => void connectionQuery.refetch()}>
                  Try again
                </Button>
              }
            />
          ) : connectionQuery.isLoading || !connection ? (
            <LoadingState label="Loading connection..." />
          ) : (
            <>
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{connection.displayName}</p>
                    <p className="text-xs text-muted-foreground">{connection.id}</p>
                  </div>
                  <ConnectionStatusBadge status={connection.status} />
                </div>
                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Last sync</dt>
                    <dd>{formatDateTime(connection.lastSyncAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Last health</dt>
                    <dd>{formatDateTime(connection.lastHealthAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Credentials</dt>
                    <dd>{connection.hasCredentials ? 'Stored' : 'Not set'}</dd>
                  </div>
                  {connection.lastError ? (
                    <div className="pt-2">
                      <dt className="text-muted-foreground">Last error</dt>
                      <dd className="mt-1 text-danger">{connection.lastError}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              {healthQuery.data ? (
                <div className="rounded-lg border border-border p-4 text-sm">
                  <p className="mb-2 font-medium">Health</p>
                  <p className="text-muted-foreground">
                    {healthQuery.data.message ??
                      (healthQuery.data.healthy === false ? 'Unhealthy' : healthQuery.data.status)}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/settings/integrations/${connection.id}`}>Open full detail</Link>
                </Button>
                <Can permission="integrations.manage">
                  {connection.status === 'CONNECTED' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={disconnectMutation.isPending}
                      onClick={() => {
                        disconnectMutation.mutate(connection.id, {
                          onSuccess: () => {
                            showToast('Connection disconnected', 'success');
                          },
                          onError: (error) => {
                            showToast(extractApiErrorMessage(error), 'error');
                          },
                        });
                      }}
                    >
                      {disconnectMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Unplug className="size-4" />
                      )}
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onConnect(connection);
                      }}
                    >
                      Connect
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={syncMutation.isPending || connection.status !== 'CONNECTED'}
                    onClick={() => {
                      syncMutation.mutate(
                        { connectionId: connection.id, payload: { trigger: 'MANUAL' } },
                        {
                          onSuccess: () => {
                            showToast('Sync started', 'success');
                          },
                          onError: (error) => {
                            showToast(extractApiErrorMessage(error), 'error');
                          },
                        },
                      );
                    }}
                  >
                    {syncMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    Sync
                  </Button>
                </Can>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
