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
import type { PaymentRecord } from '@/features/finance/payments/api/payment.types';
import { PAYMENT_METHOD_LABELS } from '@/features/finance/payments/api/payment.types';
import { PaymentStatusBadge } from '@/features/finance/payments/components/payment-status-badge';
import {
  formatInvoiceAmount,
  formatInvoiceDate,
} from '@/features/finance/invoices/forms/invoice-form.validation';

interface PaymentListTableProps {
  readonly payments: readonly PaymentRecord[];
}

export function PaymentListTable({ payments }: PaymentListTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paid at</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <Link
                  href={`/finance/payments/${payment.id}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {formatInvoiceDate(payment.paidAt)}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/finance/invoices/${payment.invoiceId}`}
                  className="text-muted-foreground underline-offset-4 hover:underline"
                >
                  {payment.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>{payment.clientName}</TableCell>
              <TableCell>{PAYMENT_METHOD_LABELS[payment.method]}</TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.status} />
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatInvoiceAmount(payment.amount, payment.currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
