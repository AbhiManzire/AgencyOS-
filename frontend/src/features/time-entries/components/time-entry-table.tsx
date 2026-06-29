'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/design-system';
import { TimeEntryRowActions } from '@/features/time-entries/components/time-entry-row-actions';
import {
  formatDurationMinutes,
  formatTimeEntryDateTime,
} from '@/features/time-entries/forms/time-entry-form.validation';
import type { TimeEntryListItem } from '@/features/time-entries/types';

interface TimeEntryTableProps {
  readonly entries: readonly TimeEntryListItem[];
  readonly readOnly?: boolean;
  readonly onEditEntry: (entryId: string) => void;
  readonly onDeleteEntry: (entryId: string) => void;
}

export function TimeEntryTable({
  entries,
  readOnly = false,
  onEditEntry,
  onDeleteEntry,
}: TimeEntryTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="hidden md:table-cell">Start</TableHead>
              <TableHead className="hidden md:table-cell">End</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="hidden sm:table-cell">Billable</TableHead>
              <TableHead className="hidden lg:table-cell">Notes</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{entry.userName}</p>
                    <p className="truncate text-xs text-muted-foreground md:hidden">
                      {formatTimeEntryDateTime(entry.startTime)}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatTimeEntryDateTime(entry.startTime)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatTimeEntryDateTime(entry.endTime)}
                </TableCell>
                <TableCell>{formatDurationMinutes(entry.durationMinutes)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <StatusBadge variant={entry.billable ? 'success' : 'neutral'}>
                    {entry.billable ? 'Yes' : 'No'}
                  </StatusBadge>
                </TableCell>
                <TableCell className="hidden max-w-[240px] truncate lg:table-cell">
                  {entry.notes ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  <TimeEntryRowActions
                    disabled={readOnly}
                    onEdit={() => {
                      onEditEntry(entry.id);
                    }}
                    onDelete={() => {
                      onDeleteEntry(entry.id);
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
