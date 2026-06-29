'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MilestoneRowActions } from '@/features/projects/milestones/components/milestone-row-actions';
import { MilestoneStatusBadge } from '@/features/projects/milestones/components/milestone-status-badge';
import type { ProjectMilestoneListItem } from '@/features/projects/milestones/types';
import { formatProjectDate } from '@/features/projects/utils/project-display';

interface ProjectMilestonesTableProps {
  readonly milestones: readonly ProjectMilestoneListItem[];
  readonly readOnly?: boolean;
  readonly onEditMilestone: (milestoneId: string) => void;
  readonly onDeleteMilestone: (milestoneId: string) => void;
}

export function ProjectMilestonesTable({
  milestones,
  readOnly = false,
  onEditMilestone,
  onDeleteMilestone,
}: ProjectMilestonesTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Start</TableHead>
              <TableHead className="hidden md:table-cell">Due</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="hidden lg:table-cell">Owner</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {milestones.map((milestone) => (
              <TableRow key={milestone.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{milestone.name}</p>
                    <p className="truncate text-xs text-muted-foreground lg:hidden">
                      {milestone.ownerDisplayName}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <MilestoneStatusBadge status={milestone.status} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatProjectDate(milestone.startDate)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatProjectDate(milestone.dueDate)}
                </TableCell>
                <TableCell>
                  <div className="flex min-w-[88px] items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${String(milestone.progressPercent)}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {milestone.progressPercent}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-[180px] truncate lg:table-cell">
                  {milestone.ownerDisplayName}
                </TableCell>
                <TableCell className="text-right">
                  <MilestoneRowActions
                    milestoneName={milestone.name}
                    disabled={readOnly}
                    onEdit={() => {
                      onEditMilestone(milestone.id);
                    }}
                    onDelete={() => {
                      onDeleteMilestone(milestone.id);
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
