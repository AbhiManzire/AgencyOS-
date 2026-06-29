'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InvoiceStatusBadge } from '@/features/finance/invoices/components/invoice-status-badge';
import { formatInvoiceDate } from '@/features/finance/invoices/forms/invoice-form.validation';
import type { InvoiceListItem } from '@/features/finance/invoices/types';

interface InvoiceListTableProps {
  readonly invoices: readonly InvoiceListItem[];
}

export function InvoiceListTable({ invoices }: InvoiceListTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead className="hidden md:table-cell">Client</TableHead>
              <TableHead className="hidden lg:table-cell">Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Issue Date</TableHead>
              <TableHead className="hidden sm:table-cell">Due Date</TableHead>
              <TableHead className="hidden md:table-cell">Quote</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/finance/invoices/${invoice.id}`}
                    className="text-primary hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell className="hidden max-w-[180px] truncate md:table-cell">
                  {invoice.clientName}
                </TableCell>
                <TableCell className="hidden max-w-[180px] truncate lg:table-cell">
                  {invoice.projectName}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatInvoiceDate(invoice.issueDate)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatInvoiceDate(invoice.dueDate)}
                </TableCell>
                <TableCell className="hidden md:table-cell">{invoice.quoteNumber ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
