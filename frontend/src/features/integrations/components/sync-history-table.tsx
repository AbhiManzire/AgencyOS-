'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, StatusBadge } from '@/design-system';
import type {
  IntegrationSyncDirection,
  IntegrationSyncLogRecord,
  IntegrationSyncStatus,
} from '@/features/integrations/api/integration.types';
import {
  INTEGRATION_SYNC_DIRECTION_LABELS,
  INTEGRATION_SYNC_STATUS_LABELS,
} from '@/features/integrations/api/integration.types';
import { History } from 'lucide-react';

interface SyncHistoryTableProps {
  readonly logs: readonly IntegrationSyncLogRecord[];
  readonly connectionNames?: ReadonlyMap<string, string>;
}

const STATUS_VARIANTS: Record<
  IntegrationSyncStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  PENDING: 'neutral',
  RUNNING: 'primary',
  SUCCEEDED: 'success',
  FAILED: 'danger',
  CANCELLED: 'neutral',
};

function formatDuration(durationMs: number | null): string {
  if (durationMs == null) {
    return '—';
  }
  if (durationMs < 1000) {
    return `${String(durationMs)} ms`;
  }
  return `${(durationMs / 1000).toFixed(1)} s`;
}

function formatDirection(direction: IntegrationSyncDirection): string {
  return INTEGRATION_SYNC_DIRECTION_LABELS[direction];
}

export function SyncHistoryTable({ logs, connectionNames }: SyncHistoryTableProps) {
  if (logs.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No sync history"
        description="Manual or scheduled syncs will appear here."
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Duration</TableHead>
              <TableHead className="hidden sm:table-cell">Retries</TableHead>
              <TableHead className="hidden lg:table-cell">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="font-medium">{log.providerKey}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {connectionNames?.get(log.connectionId) ?? log.connectionId}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{formatDirection(log.direction)}</TableCell>
                <TableCell>
                  <StatusBadge variant={STATUS_VARIANTS[log.status]}>
                    {INTEGRATION_SYNC_STATUS_LABELS[log.status]}
                  </StatusBadge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatDuration(log.durationMs)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">{log.retries}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {new Date(log.createdAt).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
