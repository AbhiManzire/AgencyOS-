'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LedgerEntryRecord } from '@/features/finance/ledger/api/ledger.types';
import { LEDGER_ACCOUNT_TYPE_LABELS } from '@/features/finance/shared/finance.types';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';

interface LedgerListTableProps {
  readonly entries: readonly LedgerEntryRecord[];
}

export function LedgerListTable({ entries }: LedgerListTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap">
                {formatShortDate(entry.entryDate)}
              </TableCell>
              <TableCell>{LEDGER_ACCOUNT_TYPE_LABELS[entry.accountType]}</TableCell>
              <TableCell className="font-mono text-xs">
                {entry.entityType}:{entry.entityId.slice(0, 8)}
              </TableCell>
              <TableCell className="max-w-[16rem] truncate">{entry.description ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.debit > 0 ? formatMoney(entry.debit) : '—'}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.credit > 0 ? formatMoney(entry.credit) : '—'}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.balanceAfter === null ? '—' : formatMoney(entry.balanceAfter)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
