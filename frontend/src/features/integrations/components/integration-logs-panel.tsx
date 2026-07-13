'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/design-system';
import {
  INTEGRATION_WEBHOOK_DELIVERY_STATUS_LABELS,
  type IntegrationWebhookDeliveryStatus,
} from '@/features/integrations/api/integration.types';
import { SyncHistoryTable } from '@/features/integrations/components/sync-history-table';
import {
  useIntegrationConnections,
  useIntegrationSyncLogs,
  useWebhookDeliveries,
} from '@/features/integrations/hooks/use-integrations';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { cn } from '@/lib/utils';
import { Webhook } from 'lucide-react';

type LogsTab = 'sync' | 'deliveries';

const DELIVERY_STATUS_VARIANTS: Record<
  IntegrationWebhookDeliveryStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  PENDING: 'neutral',
  SUCCEEDED: 'success',
  FAILED: 'danger',
  RETRYING: 'warning',
};

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

function formatDuration(durationMs: number | null): string {
  if (durationMs == null) {
    return '—';
  }
  if (durationMs < 1000) {
    return `${String(durationMs)} ms`;
  }
  return `${(durationMs / 1000).toFixed(1)} s`;
}

interface IntegrationLogsPanelProps {
  readonly connectionId?: string;
}

export function IntegrationLogsPanel({ connectionId }: IntegrationLogsPanelProps) {
  const [tab, setTab] = useState<LogsTab>('sync');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const listParams = useMemo(
    () => ({
      skip: (page - 1) * pageSize,
      take: pageSize,
      ...(connectionId ? { connectionId } : {}),
    }),
    [connectionId, page],
  );

  const connectionsQuery = useIntegrationConnections({ take: 100 });
  const syncLogsQuery = useIntegrationSyncLogs(listParams, { enabled: tab === 'sync' });
  const deliveriesQuery = useWebhookDeliveries(listParams, { enabled: tab === 'deliveries' });

  const connectionNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const connection of connectionsQuery.data?.items ?? []) {
      map.set(connection.id, connection.displayName);
    }
    return map;
  }, [connectionsQuery.data]);

  const activeQuery = tab === 'sync' ? syncLogsQuery : deliveriesQuery;
  const totalPages = activeQuery.data
    ? Math.max(1, Math.ceil(activeQuery.data.total / pageSize))
    : 1;

  return (
    <div className="space-y-4">
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6" aria-label="Log type">
          {(
            [
              { id: 'sync', label: 'Sync logs' },
              { id: 'deliveries', label: 'Webhook deliveries' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                'shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                tab === item.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => {
                setTab(item.id);
                setPage(1);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {activeQuery.error ? (
        <ErrorState
          message={extractApiErrorMessage(activeQuery.error)}
          action={
            <Button variant="outline" onClick={() => void activeQuery.refetch()}>
              Try again
            </Button>
          }
        />
      ) : activeQuery.isLoading ? (
        <LoadingState label={tab === 'sync' ? 'Loading sync logs...' : 'Loading deliveries...'} />
      ) : tab === 'sync' ? (
        <SyncHistoryTable
          logs={syncLogsQuery.data?.items ?? []}
          connectionNames={connectionNames}
        />
      ) : (deliveriesQuery.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={Webhook}
          title="No webhook deliveries"
          description="Incoming and outgoing webhook delivery attempts will appear here."
        />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">HTTP</TableHead>
                  <TableHead className="hidden md:table-cell">Duration</TableHead>
                  <TableHead className="hidden lg:table-cell">Attempt</TableHead>
                  <TableHead className="hidden xl:table-cell">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(deliveriesQuery.data?.items ?? []).map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono text-xs">{delivery.webhookId}</TableCell>
                    <TableCell>{delivery.direction}</TableCell>
                    <TableCell>
                      <StatusBadge variant={DELIVERY_STATUS_VARIANTS[delivery.status]}>
                        {INTEGRATION_WEBHOOK_DELIVERY_STATUS_LABELS[delivery.status]}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {delivery.httpStatus ?? '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDuration(delivery.durationMs)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {delivery.attempt}/{delivery.maxAttempts}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {formatDateTime(delivery.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {activeQuery.data && activeQuery.data.total > pageSize ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
            {activeQuery.isFetching ? ' · Updating...' : ''}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                setPage((current) => Math.max(1, current - 1));
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                setPage((current) => current + 1);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
