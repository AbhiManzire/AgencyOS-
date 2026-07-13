'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Pencil, Play, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  useToast,
} from '@/design-system';
import { CardTitle } from '@/design-system/typography';
import { ExecuteWorkflowDialog } from '@/features/workflows/components/execute-workflow-dialog';
import { ExecutionDetailDrawer } from '@/features/workflows/components/execution-detail-drawer';
import { ExecutionHistoryTable } from '@/features/workflows/components/execution-history-table';
import { WorkflowBuilderDrawer } from '@/features/workflows/components/workflow-builder-drawer';
import { WorkflowStatusBadge } from '@/features/workflows/components/workflow-status-badge';
import { useWorkflow } from '@/features/workflows/hooks/use-workflow';
import {
  useDisableWorkflow,
  useEnableWorkflow,
} from '@/features/workflows/hooks/use-workflow-mutations';
import { useWorkflowExecutions } from '@/features/workflows/executions/hooks/use-executions';
import { WORKFLOW_ACTION_LABELS, WORKFLOW_TRIGGER_LABELS } from '@/features/workflows/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params.id;
  const { showToast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [executeOpen, setExecuteOpen] = useState(false);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const pageSize = 10;

  const workflowQuery = useWorkflow(workflowId);
  const enableMutation = useEnableWorkflow();
  const disableMutation = useDisableWorkflow();

  const executionParams = useMemo(
    () => ({
      skip: (historyPage - 1) * pageSize,
      take: pageSize,
    }),
    [historyPage],
  );

  const executionsQuery = useWorkflowExecutions(workflowId, executionParams);
  const workflow = workflowQuery.data;
  const isEnabled = workflow?.isEnabled ?? workflow?.status === 'ACTIVE';
  const isToggling = enableMutation.isPending || disableMutation.isPending;

  const totalPages = executionsQuery.data
    ? Math.max(1, Math.ceil(executionsQuery.data.total / pageSize))
    : 1;

  if (workflowQuery.isLoading) {
    return (
      <PageContainer size="2xl">
        <LoadingState label="Loading workflow..." />
      </PageContainer>
    );
  }

  if (workflowQuery.error || !workflow) {
    return (
      <PageContainer size="2xl">
        <ErrorState
          message={extractApiErrorMessage(workflowQuery.error)}
          action={
            <Button variant="outline" onClick={() => void workflowQuery.refetch()}>
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
        <Link href="/settings/workflows">
          <ArrowLeft className="size-4" />
          Back to workflows
        </Link>
      </Button>

      <PageHeader
        title={workflow.name}
        description={workflow.description ?? 'Workflow detail and execution history'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Can permission="workflows.create">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setEditOpen(true);
                }}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={isToggling}
                onClick={() => {
                  const mutation = isEnabled ? disableMutation : enableMutation;
                  mutation.mutate(workflow.id, {
                    onSuccess: () => {
                      showToast(isEnabled ? 'Workflow disabled' : 'Workflow enabled', 'success');
                    },
                    onError: (error) => {
                      showToast(extractApiErrorMessage(error), 'error');
                    },
                  });
                }}
              >
                {isToggling ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isEnabled ? (
                  <PowerOff className="size-4" />
                ) : (
                  <Power className="size-4" />
                )}
                {isEnabled ? 'Disable' : 'Enable'}
              </Button>
              <Button
                type="button"
                className="gap-2"
                onClick={() => {
                  setExecuteOpen(true);
                }}
              >
                <Play className="size-4" />
                Execute
              </Button>
            </Can>
          </div>
        }
      />

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <WorkflowStatusBadge status={workflow.status} />
            <p className="text-sm text-muted-foreground">
              {isEnabled ? 'Enabled' : 'Disabled'}
              {workflow.version != null ? ` · v${String(workflow.version)}` : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Triggers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {workflow.triggers.length > 0
                ? workflow.triggers
                    .map((trigger) => WORKFLOW_TRIGGER_LABELS[trigger.type])
                    .join(', ')
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {workflow.actions.length > 0
                ? workflow.actions.map((action) => WORKFLOW_ACTION_LABELS[action.type]).join(', ')
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Execution history</h2>

        {executionsQuery.error ? (
          <ErrorState
            message={extractApiErrorMessage(executionsQuery.error)}
            action={
              <Button variant="outline" onClick={() => void executionsQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : executionsQuery.isLoading ? (
          <LoadingState label="Loading executions..." />
        ) : !executionsQuery.data || executionsQuery.data.items.length === 0 ? (
          <EmptyState
            title="No executions yet"
            description="Run this workflow manually or wait for a matching trigger."
            action={
              <Can permission="workflows.create">
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => {
                    setExecuteOpen(true);
                  }}
                >
                  <Play className="size-4" />
                  Execute
                </Button>
              </Can>
            }
          />
        ) : (
          <>
            <ExecutionHistoryTable
              executions={executionsQuery.data.items}
              onSelect={(executionId) => {
                setSelectedExecutionId(executionId);
              }}
            />
            {executionsQuery.data.total > pageSize ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {historyPage} of {totalPages}
                  {executionsQuery.isFetching ? ' · Updating...' : ''}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={historyPage <= 1}
                    onClick={() => {
                      setHistoryPage((current) => Math.max(1, current - 1));
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={historyPage >= totalPages}
                    onClick={() => {
                      setHistoryPage((current) => current + 1);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <WorkflowBuilderDrawer open={editOpen} onOpenChange={setEditOpen} workflow={workflow} />
      <ExecuteWorkflowDialog
        open={executeOpen}
        workflowId={workflow.id}
        workflowName={workflow.name}
        onOpenChange={setExecuteOpen}
      />
      <ExecutionDetailDrawer
        open={selectedExecutionId != null}
        executionId={selectedExecutionId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExecutionId(null);
          }
        }}
      />
    </PageContainer>
  );
}
