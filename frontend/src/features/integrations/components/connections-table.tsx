'use client';

import Link from 'next/link';
import { Activity, Loader2, Plug, PlugZap, RefreshCw, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, useToast } from '@/design-system';
import type { IntegrationConnectionRecord } from '@/features/integrations/api/integration.types';
import { INTEGRATION_CATEGORY_LABELS } from '@/features/integrations/api/integration.types';
import { ConnectionStatusBadge } from '@/features/integrations/components/connection-status-badge';
import {
  useDisconnectIntegration,
  useSyncIntegration,
} from '@/features/integrations/hooks/use-integration-mutations';
import { getIntegrationConnectionHealth } from '@/features/integrations/api/integrations.api';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';
import { useState } from 'react';

interface ConnectionsTableProps {
  readonly connections: readonly IntegrationConnectionRecord[];
  readonly onConnect: (connection: IntegrationConnectionRecord) => void;
  readonly onSelect?: (connection: IntegrationConnectionRecord) => void;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ConnectionsTable({ connections, onConnect, onSelect }: ConnectionsTableProps) {
  const { showToast } = useToast();
  const disconnectMutation = useDisconnectIntegration();
  const syncMutation = useSyncIntegration();
  const [healthCheckingId, setHealthCheckingId] = useState<string | null>(null);

  if (connections.length === 0) {
    return (
      <EmptyState
        icon={Plug}
        title="No connections yet"
        description="Add a provider from the marketplace to create your first connection."
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden lg:table-cell">Last sync</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.map((connection) => {
              const isDisconnecting =
                disconnectMutation.isPending && disconnectMutation.variables === connection.id;
              const isSyncing =
                syncMutation.isPending && syncMutation.variables.connectionId === connection.id;
              const isHealthChecking = healthCheckingId === connection.id;

              return (
                <TableRow key={connection.id}>
                  <TableCell className="font-medium">
                    <div className="min-w-0">
                      <Link
                        href={`/settings/integrations/${connection.id}`}
                        className="truncate text-primary hover:underline"
                      >
                        {connection.displayName}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {connection.providerKey}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ConnectionStatusBadge status={connection.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {INTEGRATION_CATEGORY_LABELS[connection.category]}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatDateTime(connection.lastSyncAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onSelect?.(connection);
                        }}
                      >
                        Details
                      </Button>
                      <Can permission="integrations.manage">
                        {connection.status === 'CONNECTED' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isDisconnecting}
                            title="Disconnect"
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
                            {isDisconnecting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Unplug className="size-4" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Connect"
                            onClick={() => {
                              onConnect(connection);
                            }}
                          >
                            <PlugZap className="size-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isSyncing || connection.status !== 'CONNECTED'}
                          title="Sync"
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
                          {isSyncing ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="size-4" />
                          )}
                        </Button>
                      </Can>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isHealthChecking}
                        title="Health check"
                        onClick={() => {
                          setHealthCheckingId(connection.id);
                          void getIntegrationConnectionHealth(connection.id)
                            .then((health) => {
                              const label =
                                health.message ??
                                (health.healthy === false
                                  ? 'Unhealthy'
                                  : health.status === 'CONNECTED'
                                    ? 'Healthy'
                                    : health.status);
                              showToast(`${connection.displayName}: ${label}`, 'success');
                            })
                            .catch((error: unknown) => {
                              showToast(extractApiErrorMessage(error), 'error');
                            })
                            .finally(() => {
                              setHealthCheckingId(null);
                            });
                        }}
                      >
                        {isHealthChecking ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Activity className="size-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
