'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FollowUpRowActions } from '@/features/sales/follow-ups/components/follow-up-row-actions';
import { FollowUpStatusBadge } from '@/features/sales/follow-ups/components/follow-up-status-badge';
import { formatFollowUpType } from '@/features/sales/follow-ups/components/follow-up-type-label';
import { formatFollowUpDateTime } from '@/features/sales/follow-ups/forms/follow-up-form.validation';
import type { FollowUpListItem } from '@/features/sales/follow-ups/types';

interface FollowUpsTableProps {
  readonly followUps: readonly FollowUpListItem[];
  readonly readOnly?: boolean;
  readonly onEditFollowUp: (followUpId: string) => void;
  readonly onDeleteFollowUp: (followUpId: string) => void;
}

export function FollowUpsTable({
  followUps,
  readOnly = false,
  onEditFollowUp,
  onDeleteFollowUp,
}: FollowUpsTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead className="hidden xl:table-cell">Outcome</TableHead>
              <TableHead className="hidden xl:table-cell">Next follow-up</TableHead>
              <TableHead className="hidden lg:table-cell">Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {followUps.map((followUp) => (
              <TableRow key={followUp.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{followUp.subject}</p>
                    <p className="truncate text-xs text-muted-foreground md:hidden">
                      {formatFollowUpType(followUp.type)}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatFollowUpType(followUp.type)}
                </TableCell>
                <TableCell>{formatFollowUpDateTime(followUp.scheduledAt)}</TableCell>
                <TableCell className="hidden max-w-[180px] truncate xl:table-cell">
                  {followUp.outcome ?? '—'}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {formatFollowUpDateTime(followUp.nextFollowUpAt)}
                </TableCell>
                <TableCell className="hidden max-w-[180px] truncate lg:table-cell">
                  {followUp.ownerName}
                </TableCell>
                <TableCell>
                  <FollowUpStatusBadge status={followUp.status} />
                </TableCell>
                <TableCell className="text-right">
                  <FollowUpRowActions
                    subject={followUp.subject}
                    disabled={readOnly}
                    onEdit={() => {
                      onEditFollowUp(followUp.id);
                    }}
                    onDelete={() => {
                      onDeleteFollowUp(followUp.id);
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
