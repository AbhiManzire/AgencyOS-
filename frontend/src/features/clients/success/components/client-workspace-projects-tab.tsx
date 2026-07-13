'use client';

import Link from 'next/link';
import { EmptyState } from '@/design-system';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ClientWorkspaceProject } from '@/features/clients/success/api/client-success.types';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';

interface ClientWorkspaceProjectsTabProps {
  readonly projects: readonly ClientWorkspaceProject[];
  readonly currency?: string;
}

function toAmount(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }
  return typeof value === 'number' ? value : Number(value);
}

export function ClientWorkspaceProjectsTab({
  projects,
  currency = 'USD',
}: ClientWorkspaceProjectsTabProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects"
        description="Projects linked to this client will appear here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>Target end</TableHead>
            <TableHead>Budget</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const budget = toAmount(project.budgetAmount);

            return (
              <TableRow key={project.id}>
                <TableCell>
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {project.name}
                  </Link>
                  {project.code ? (
                    <p className="text-xs text-muted-foreground">{project.code}</p>
                  ) : null}
                </TableCell>
                <TableCell>{project.status}</TableCell>
                <TableCell>{project.priority}</TableCell>
                <TableCell>{formatShortDate(project.startDate)}</TableCell>
                <TableCell>{formatShortDate(project.targetEndDate)}</TableCell>
                <TableCell>{budget === null ? '—' : formatMoney(budget, currency)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
