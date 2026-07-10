'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/design-system';
import type { FounderReport } from '@/features/reports/api/reports.types';

interface ReportTableProps {
  readonly report: FounderReport;
}

function formatCell(value: string | number | null): string {
  if (value === null || value === '') {
    return '—';
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
  }

  return value;
}

/** Tabular detail rows for the active founder report. */
export function ReportTable({ report }: ReportTableProps) {
  if (report.rows.length === 0) {
    return (
      <EmptyState
        title="No rows in range"
        description="Adjust the date range or choose another report."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {report.columns.map((column) => (
            <TableHead key={column.key}>{column.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {report.rows.map((row, index) => (
          <TableRow key={`${String(index)}-${String(row[report.columns[0]?.key] ?? '')}`}>
            {report.columns.map((column) => (
              <TableCell key={column.key}>{formatCell(row[column.key] ?? null)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
