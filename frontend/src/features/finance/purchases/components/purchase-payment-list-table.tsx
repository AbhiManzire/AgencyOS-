'use client';

import { Ban, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaymentStatusBadge } from '@/features/finance/payments/components/payment-status-badge';
import type { PurchasePaymentRecord } from '@/features/finance/purchases/api/purchase-payment.types';
import {
  formatPurchaseBillAmount,
  formatPurchaseBillDate,
} from '@/features/finance/purchases/forms/purchase-bill-form.validation';
import { PAYMENT_METHOD_LABELS } from '@/features/finance/shared/finance.types';

interface PurchasePaymentListTableProps {
  readonly payments: readonly PurchasePaymentRecord[];
  readonly canVoid?: boolean;
  readonly onVoidPayment?: (paymentId: string) => void;
}

export function PurchasePaymentListTable({
  payments,
  canVoid = false,
  onVoidPayment,
}: PurchasePaymentListTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paid at</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Reference</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {canVoid ? <TableHead className="w-12 text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">
                {formatPurchaseBillDate(payment.paidAt)}
              </TableCell>
              <TableCell>{PAYMENT_METHOD_LABELS[payment.method]}</TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.status} />
              </TableCell>
              <TableCell className="hidden sm:table-cell">{payment.reference ?? '—'}</TableCell>
              <TableCell className="text-right font-medium">
                {formatPurchaseBillAmount(payment.amount, payment.currency)}
              </TableCell>
              {canVoid ? (
                <TableCell className="text-right">
                  {payment.status === 'COMPLETED' ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for payment on ${formatPurchaseBillDate(payment.paidAt)}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2 text-danger focus:text-danger"
                          onSelect={() => {
                            onVoidPayment?.(payment.id);
                          }}
                        >
                          <Ban className="size-4" />
                          Void payment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
