'use client';

import { Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge, useToast } from '@/design-system';
import type { WorkflowExecutionRecord } from '@/features/workflows/executions/api/execution.types';
import { useRetryExecution } from '@/features/workflows/executions/hooks/use-executions';
import type { WorkflowExecutionStatus } from '@/features/workflows/types';
import {
  WORKFLOW_EXECUTION_STATUS_LABELS,
  WORKFLOW_TRIGGER_LABELS,
} from '@/features/workflows/types';
import type { WorkflowTriggerType } from '@/features/workflows/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

interface ExecutionHistoryTableProps {
  readonly executions: readonly WorkflowExecutionRecord[];
  readonly onSelect: (executionId: string) => void;
}

const STATUS_VARIANTS: Record<
  WorkflowExecutionStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  PENDING: 'neutral',
  RUNNING: 'primary',
  SUCCEEDED: 'success',
  FAILED: 'danger',
  RETRYING: 'warning',
  CANCELLED: 'neutral',
  SKIPPED: 'warning',
};

function formatDateTime(value: string | null | undefined): string {
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

function formatDuration(
  durationMs: number | null | undefined,
  startedAt: string | null,
  finishedAt: string | null,
): string {
  if (durationMs != null) {
    if (durationMs < 1000) {
      return `${String(durationMs)} ms`;
    }
    return `${(durationMs / 1000).toFixed(1)} s`;
  }
  if (startedAt && finishedAt) {
    const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    if (Number.isFinite(ms) && ms >= 0) {
      return ms < 1000 ? `${String(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
    }
  }
  return '—';
}

function formatTrigger(triggerType: string | null): string {
  if (!triggerType) {
    return '—';
  }
  return triggerType in WORKFLOW_TRIGGER_LABELS
    ? WORKFLOW_TRIGGER_LABELS[triggerType as WorkflowTriggerType]
    : triggerType;
}

export function ExecutionHistoryTable({ executions, onSelect }: ExecutionHistoryTableProps) {
  const { showToast } = useToast();
  const retryMutation = useRetryExecution();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead className="hidden sm:table-cell">Started</TableHead>
              <TableHead className="hidden md:table-cell">Duration</TableHead>
              <TableHead className="hidden lg:table-cell">Error</TableHead>
              <TableHead className="text-right">Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.map((execution) => {
              const isRetrying =
                retryMutation.isPending && retryMutation.variables === execution.id;

              return (
                <TableRow key={execution.id}>
                  <TableCell>
                    <StatusBadge variant={STATUS_VARIANTS[execution.status]}>
                      {WORKFLOW_EXECUTION_STATUS_LABELS[execution.status]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{formatTrigger(execution.triggerType)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatDateTime(execution.startedAt ?? execution.createdAt)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDuration(
                      execution.durationMs,
                      execution.startedAt,
                      execution.finishedAt,
                    )}
                  </TableCell>
                  <TableCell className="hidden max-w-[240px] truncate lg:table-cell">
                    {execution.errorMessage ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onSelect(execution.id);
                        }}
                      >
                        Logs
                      </Button>
                      <Can permission="workflows.create">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={
                            isRetrying ||
                            (execution.status !== 'FAILED' && execution.status !== 'RETRYING')
                          }
                          onClick={() => {
                            retryMutation.mutate(execution.id, {
                              onSuccess: () => {
                                showToast('Retry scheduled', 'success');
                              },
                              onError: (error) => {
                                showToast(extractApiErrorMessage(error), 'error');
                              },
                            });
                          }}
                        >
                          {isRetrying ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <RotateCcw className="size-4" />
                          )}
                        </Button>
                      </Can>
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
