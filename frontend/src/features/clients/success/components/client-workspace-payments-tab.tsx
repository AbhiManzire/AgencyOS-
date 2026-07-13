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
import type { ClientWorkspacePayment } from '@/features/clients/success/api/client-success.types';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';
import { displayClientField } from '@/features/clients/utils/client-display';

interface ClientWorkspacePaymentsTabProps {
  readonly payments: readonly ClientWorkspacePayment[];
}

export function ClientWorkspacePaymentsTab({ payments }: ClientWorkspacePaymentsTabProps) {
  if (payments.length === 0) {
    return (
      <EmptyState
        title="No payments"
        description="Payments against this client's invoices will appear here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paid at</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Reference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{formatShortDate(payment.paidAt)}</TableCell>
              <TableCell>{formatMoney(payment.amount, payment.currency)}</TableCell>
              <TableCell>{payment.status}</TableCell>
              <TableCell>{payment.method}</TableCell>
              <TableCell>
                <Link
                  href={`/finance/invoices/${payment.invoiceId}`}
                  className="font-medium text-primary hover:underline"
                >
                  View invoice
                </Link>
              </TableCell>
              <TableCell>{displayClientField(payment.reference)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
