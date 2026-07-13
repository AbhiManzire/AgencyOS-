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
import type { ClientWorkspaceInvoice } from '@/features/clients/success/api/client-success.types';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';

interface ClientWorkspaceInvoicesTabProps {
  readonly invoices: readonly ClientWorkspaceInvoice[];
}

function toAmount(value: number | string | null): number {
  if (value === null) {
    return 0;
  }
  return typeof value === 'number' ? value : Number(value);
}

export function ClientWorkspaceInvoicesTab({ invoices }: ClientWorkspaceInvoicesTabProps) {
  if (invoices.length === 0) {
    return (
      <EmptyState title="No invoices" description="Invoices for this client will appear here." />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issue date</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Balance due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Link
                  href={`/finance/invoices/${invoice.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {invoice.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell>{formatShortDate(invoice.issueDate)}</TableCell>
              <TableCell>{formatShortDate(invoice.dueDate)}</TableCell>
              <TableCell>{formatMoney(toAmount(invoice.grandTotal), invoice.currency)}</TableCell>
              <TableCell>{formatMoney(toAmount(invoice.balanceDue), invoice.currency)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
