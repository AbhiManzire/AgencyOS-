'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WorkflowStatusBadge } from '@/features/workflows/components/workflow-status-badge';
import type { WorkflowListItem } from '@/features/workflows/types';
import { WORKFLOW_ACTION_LABELS, WORKFLOW_TRIGGER_LABELS } from '@/features/workflows/types';

interface WorkflowListTableProps {
  readonly workflows: readonly WorkflowListItem[];
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

export function WorkflowListTable({ workflows }: WorkflowListTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Triggers</TableHead>
              <TableHead className="hidden lg:table-cell">Actions</TableHead>
              <TableHead className="hidden sm:table-cell">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell className="font-medium">
                  <div className="min-w-0">
                    <p className="truncate">{workflow.name}</p>
                    {workflow.description ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {workflow.description}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <WorkflowStatusBadge status={workflow.status} />
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
