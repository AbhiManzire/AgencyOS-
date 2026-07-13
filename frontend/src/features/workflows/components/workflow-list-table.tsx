'use client';

import Link from 'next/link';
import { Loader2, Play, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/design-system';
import { WorkflowStatusBadge } from '@/features/workflows/components/workflow-status-badge';
import {
  useDisableWorkflow,
  useEnableWorkflow,
} from '@/features/workflows/hooks/use-workflow-mutations';
import type { WorkflowListItem } from '@/features/workflows/types';
import { WORKFLOW_ACTION_LABELS, WORKFLOW_TRIGGER_LABELS } from '@/features/workflows/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

interface WorkflowListTableProps {
  readonly workflows: readonly WorkflowListItem[];
  readonly onExecute: (workflowId: string) => void;
}

function formatWorkflowDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTypeList<T extends string>(types: readonly T[], labels: Record<T, string>): string {
  if (types.length === 0) {
    return '—';
  }

  return types.map((type) => labels[type]).join(', ');
}

export function WorkflowListTable({ workflows, onExecute }: WorkflowListTableProps) {
  const { showToast } = useToast();
  const enableMutation = useEnableWorkflow();
  const disableMutation = useDisableWorkflow();
  const togglingId =
    enableMutation.isPending || disableMutation.isPending
      ? (enableMutation.variables ?? disableMutation.variables ?? null)
      : null;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Version</TableHead>
              <TableHead className="hidden md:table-cell">Triggers</TableHead>
              <TableHead className="hidden lg:table-cell">Actions</TableHead>
              <TableHead className="hidden sm:table-cell">Updated</TableHead>
              <TableHead className="text-right">Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((workflow) => {
              const isToggling = togglingId === workflow.id;

              return (
                <TableRow key={workflow.id}>
                  <TableCell className="font-medium">
                    <div className="min-w-0">
                      <Link
                        href={`/settings/workflows/${workflow.id}`}
                        className="truncate text-primary hover:underline"
                      >
                        {workflow.name}
                      </Link>
                      {workflow.description ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {workflow.description}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <WorkflowStatusBadge status={workflow.status} />
                      <span className="text-xs text-muted-foreground">
                        {workflow.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {workflow.version != null ? `v${String(workflow.version)}` : '—'}
                  </TableCell>
                  <TableCell className="hidden max-w-[220px] truncate md:table-cell">
                    {formatTypeList(workflow.triggerTypes, WORKFLOW_TRIGGER_LABELS)}
                  </TableCell>
                  <TableCell className="hidden max-w-[220px] truncate lg:table-cell">
                    {formatTypeList(workflow.actionTypes, WORKFLOW_ACTION_LABELS)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatWorkflowDate(workflow.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/settings/workflows/${workflow.id}`}>History</Link>
                      </Button>
                      <Can permission="workflows.create">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isToggling}
                          onClick={() => {
                            const mutation = workflow.isEnabled ? disableMutation : enableMutation;
                            mutation.mutate(workflow.id, {
                              onSuccess: () => {
                                showToast(
                                  workflow.isEnabled ? 'Workflow disabled' : 'Workflow enabled',
                                  'success',
                                );
                              },
                              onError: (error) => {
                                showToast(extractApiErrorMessage(error), 'error');
                              },
                            });
                          }}
                        >
                          {isToggling ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : workflow.isEnabled ? (
                            <PowerOff className="size-4" />
                          ) : (
                            <Power className="size-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onExecute(workflow.id);
                          }}
                        >
                          <Play className="size-4" />
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
