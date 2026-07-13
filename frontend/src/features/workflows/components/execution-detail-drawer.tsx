'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, StatusBadge } from '@/design-system';
import {
  useExecution,
  useExecutionLogs,
} from '@/features/workflows/executions/hooks/use-executions';
import type {
  WorkflowExecutionLogLevel,
  WorkflowExecutionStatus,
} from '@/features/workflows/types';
import {
  WORKFLOW_EXECUTION_STATUS_LABELS,
  WORKFLOW_TRIGGER_LABELS,
} from '@/features/workflows/types';
import type { WorkflowTriggerType } from '@/features/workflows/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface ExecutionDetailDrawerProps {
  readonly open: boolean;
  readonly executionId: string | null;
  readonly onOpenChange: (open: boolean) => void;
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

const LOG_LEVEL_VARIANTS: Record<
  WorkflowExecutionLogLevel,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  DEBUG: 'neutral',
  INFO: 'primary',
  WARN: 'warning',
  ERROR: 'danger',
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString();
}

/** Drawer showing a single execution summary and step logs. */
export function ExecutionDetailDrawer({
  open,
  executionId,
  onOpenChange,
}: ExecutionDetailDrawerProps) {
  const executionQuery = useExecution(executionId ?? '', {
    enabled: open && Boolean(executionId),
  });
  const logsQuery = useExecutionLogs(executionId ?? '', {
    enabled: open && Boolean(executionId),
  });

  const execution = executionQuery.data;
  const logs = logsQuery.data ?? execution?.logs ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <div className="space-y-6 pb-6">
          <SectionTitle>Execution detail</SectionTitle>

          {executionQuery.error ? (
            <ErrorState
              message={extractApiErrorMessage(executionQuery.error)}
              action={
                <Button variant="outline" onClick={() => void executionQuery.refetch()}>
                  Try again
                </Button>
              }
            />
          ) : executionQuery.isLoading || !execution ? (
            <LoadingState label="Loading execution..." />
          ) : (
            <>
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge variant={STATUS_VARIANTS[execution.status]}>
                    {WORKFLOW_EXECUTION_STATUS_LABELS[execution.status]}
                  </StatusBadge>
                  <span className="text-sm text-muted-foreground">
                    Attempt {execution.attempt}/{execution.maxAttempts}
                    {execution.retryCount != null
                      ? ` · Retries ${String(execution.retryCount)}`
                      : ''}
                  </span>
                </div>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Trigger</dt>
                    <dd>
                      {execution.triggerType
                        ? execution.triggerType in WORKFLOW_TRIGGER_LABELS
                          ? WORKFLOW_TRIGGER_LABELS[execution.triggerType as WorkflowTriggerType]
                          : execution.triggerType
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Started</dt>
                    <dd>{formatDateTime(execution.startedAt ?? execution.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Finished</dt>
                    <dd>{formatDateTime(execution.finishedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd>
                      {execution.durationMs != null ? `${String(execution.durationMs)} ms` : '—'}
                    </dd>
                  </div>
                </dl>
                {execution.errorMessage ? (
                  <p className="text-sm text-danger">{execution.errorMessage}</p>
                ) : null}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Logs</h3>
                {logsQuery.isLoading && logs.length === 0 ? (
                  <LoadingState label="Loading logs..." />
                ) : logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No logs for this execution.</p>
                ) : (
                  <ul className="space-y-2">
                    {logs.map((log) => (
                      <li
                        key={log.id}
                        className="rounded-md border border-border bg-background px-3 py-2"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <StatusBadge variant={LOG_LEVEL_VARIANTS[log.level]}>
                            {log.level}
                          </StatusBadge>
                          {log.stepKey ? (
                            <span className="text-xs text-muted-foreground">{log.stepKey}</span>
                          ) : null}
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(log.occurredAt)}
                          </span>
                        </div>
                        <p className="text-sm">{log.message}</p>
                        {log.details != null ? (
                          <pre className="mt-2 overflow-x-auto rounded bg-muted/40 p-2 text-xs">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
