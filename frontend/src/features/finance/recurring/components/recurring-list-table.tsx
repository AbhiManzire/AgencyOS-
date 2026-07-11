'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RecurringRecord } from '@/features/finance/recurring/api/recurring.types';
import { RECURRING_FREQUENCY_LABELS } from '@/features/finance/shared/finance.types';
import { formatDateTime } from '@/lib/format/date';

interface RecurringListTableProps {
  readonly items: readonly RecurringRecord[];
}

export function RecurringListTable({ items }: RecurringListTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Frequency</TableHead>
            <TableHead>Next run</TableHead>
            <TableHead>Last run</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {RECURRING_FREQUENCY_LABELS[item.frequency]}
              </TableCell>
              <TableCell>{formatDateTime(item.nextRunAt)}</TableCell>
              <TableCell>{formatDateTime(item.lastRunAt)}</TableCell>
              <TableCell>{item.isActive ? 'Yes' : 'No'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
