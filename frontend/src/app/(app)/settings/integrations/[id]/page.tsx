'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, Loader2, PlugZap, RefreshCw, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  useToast,
} from '@/design-system';
import { CardTitle, Caption } from '@/design-system/typography';
import { INTEGRATION_CATEGORY_LABELS } from '@/features/integrations/api/integration.types';
import { ConnectCredentialsDrawer } from '@/features/integrations/components/connect-credentials-drawer';
import { ConnectionStatusBadge } from '@/features/integrations/components/connection-status-badge';
import { IntegrationLogsPanel } from '@/features/integrations/components/integration-logs-panel';
import { SyncHistoryTable } from '@/features/integrations/components/sync-history-table';
import {
  useDisconnectIntegration,
  useSyncIntegration,
} from '@/features/integrations/hooks/use-integration-mutations';
import {
  useConnectionSyncLogs,
  useConnectionWebhooks,
  useIntegrationConnection,
  useIntegrationConnectionHealth,
} from '@/features/integrations/hooks/use-integrations';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString();
}

export default function IntegrationConnectionDetailPage() {
  const params = useParams<{ id: string }>();
  const connectionId = params.id;
  const { showToast } = useToast();
  const [connectOpen, setConnectOpen] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const pageSize = 10;

  const connectionQuery = useIntegrationConnection(connectionId);
  const healthQuery = useIntegrationConnectionHealth(connectionId);
  const disconnectMutation = useDisconnectIntegration();
  const syncMutation = useSyncIntegration();

  const syncParams = useMemo(
    () => ({
      skip: (logsPage - 1) * pageSize,
      take: pageSize,
    }),
    [logsPage],
  );
  const syncLogsQuery = useConnectionSyncLogs(connectionId, syncParams);
  const webhooksQuery = useConnectionWebhooks(connectionId, { take: 50 });

  const connection = connectionQuery.data;
  const connectionNames = useMemo(() => {
    const map = new Map<string, string>();
    if (connection) {
      map.set(connection.id, connection.displayName);
    }
    return map;
  }, [connection]);

  const syncTotalPages = syncLogsQuery.data
    ? Math.max(1, Math.ceil(syncLogsQuery.data.total / pageSize))
    : 1;

  if (connectionQuery.isLoading) {
    return (
      <PageContainer size="2xl">
        <LoadingState label="Loading connection..." />
      </PageContainer>
    );
  }

  if (connectionQuery.error || !connection) {
    return (
      <PageContainer size="2xl">
        <ErrorState
          message={extractApiErrorMessage(connectionQuery.error)}
          action={
            <Button variant="outline" onClick={() => void connectionQuery.refetch()}>
              Try again
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="2xl">
      <Button variant="ghost" size="sm" className="mb-4 gap-2 px-0" asChild>
        <Link href="/settings/integrations">
          <ArrowLeft className="size-4" />
          Back to integrations
        </Link>
      </Button>

      <PageHeader
        title={connection.displayName}
        description={`${connection.providerKey} · ${
          INTEGRATION_CATEGORY_LABELS[connection.category]
        }`}
        actions={
          <div className="flex flex-wrap gap-2">
            <ConnectionStatusBadge status={connection.status} />
            <Can permission="integrations.manage">
              {connection.status === 'CONNECTED' ? (
                <Button
                  type="button"
                  variant="outline"
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
                  className="gap-2"
                  onClick={() => {
                    setConnectOpen(true);
                  }}
                >
                  <PlugZap className="size-4" />
                  Connect
                </Button>
              )}
              <Button
                type="button"
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
        }
      />

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connection</CardTitle>
            <Caption>Status and sync metadata</Caption>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
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
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Enabled</dt>
                <dd>{connection.isEnabled ? 'Yes' : 'No'}</dd>
              </div>
              {connection.lastError ? (
                <div className="pt-2">
                  <dt className="text-muted-foreground">Last error</dt>
                  <dd className="mt-1 text-danger">{connection.lastError}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Health</CardTitle>
            <Caption>Latest health check result</Caption>
          </CardHeader>
          <CardContent>
            {healthQuery.isLoading ? (
              <LoadingState label="Checking health..." />
            ) : healthQuery.error ? (
              <ErrorState
                message={extractApiErrorMessage(healthQuery.error)}
                action={
                  <Button variant="outline" size="sm" onClick={() => void healthQuery.refetch()}>
                    Try again
                  </Button>
                }
              />
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    {healthQuery.data ? (
                      <ConnectionStatusBadge status={healthQuery.data.status} />
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Checked</dt>
                  <dd>{formatDateTime(healthQuery.data?.checkedAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Message</dt>
                  <dd className="mt-1">
                    {healthQuery.data?.message ??
                      (healthQuery.data?.healthy === false ? 'Unhealthy' : '—')}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="mb-8 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <p className="text-sm text-muted-foreground">
            Registered incoming and outgoing webhooks for this connection.
          </p>
        </div>
        {webhooksQuery.error ? (
          <ErrorState
            message={extractApiErrorMessage(webhooksQuery.error)}
            action={
              <Button variant="outline" onClick={() => void webhooksQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : webhooksQuery.isLoading ? (
          <LoadingState label="Loading webhooks..." />
        ) : (webhooksQuery.data?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No webhooks registered.</p>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4">
            <ul className="space-y-3">
              {(webhooksQuery.data?.items ?? []).map((webhook) => (
                <li key={webhook.id} className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{webhook.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {webhook.direction}
                      {webhook.endpointPath ? ` · /${webhook.endpointPath}` : ''}
                      {webhook.targetUrl ? ` · ${webhook.targetUrl}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {webhook.isActive ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mb-8 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Sync history</h2>
          <p className="text-sm text-muted-foreground">Recent sync attempts for this connection.</p>
        </div>
        {syncLogsQuery.error ? (
          <ErrorState
            message={extractApiErrorMessage(syncLogsQuery.error)}
            action={
              <Button variant="outline" onClick={() => void syncLogsQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : syncLogsQuery.isLoading ? (
          <LoadingState label="Loading sync history..." />
        ) : (
          <>
            <SyncHistoryTable
              logs={syncLogsQuery.data?.items ?? []}
              connectionNames={connectionNames}
            />
            {syncLogsQuery.data && syncLogsQuery.data.total > pageSize ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {logsPage} of {syncTotalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logsPage <= 1}
                    onClick={() => {
                      setLogsPage((current) => Math.max(1, current - 1));
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logsPage >= syncTotalPages}
                    onClick={() => {
                      setLogsPage((current) => current + 1);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Logs</h2>
          <p className="text-sm text-muted-foreground">
            Sync logs and webhook deliveries filtered for this connection when supported.
          </p>
        </div>
        <IntegrationLogsPanel connectionId={connectionId} />
      </section>

      <ConnectCredentialsDrawer
        open={connectOpen}
        connection={connection}
        onOpenChange={setConnectOpen}
      />
    </PageContainer>
  );
}
