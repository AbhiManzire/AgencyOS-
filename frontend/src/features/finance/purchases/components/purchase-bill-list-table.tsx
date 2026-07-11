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
import { PurchaseBillStatusBadge } from '@/features/finance/purchases/components/purchase-bill-status-badge';
import {
  formatPurchaseBillAmount,
  formatPurchaseBillDate,
} from '@/features/finance/purchases/forms/purchase-bill-form.validation';
import type { PurchaseBillListItem } from '@/features/finance/purchases/types';

interface PurchaseBillListTableProps {
  readonly bills: readonly PurchaseBillListItem[];
}

export function PurchaseBillListTable({ bills }: PurchaseBillListTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill #</TableHead>
              <TableHead className="hidden md:table-cell">Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Issue Date</TableHead>
              <TableHead className="hidden sm:table-cell">Due Date</TableHead>
              <TableHead className="hidden md:table-cell text-right">Total</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/finance/purchases/${bill.id}`}
                    className="text-primary hover:underline"
                  >
                    {bill.billNumber}
                  </Link>
                </TableCell>
                <TableCell className="hidden max-w-[180px] truncate md:table-cell">
                  {bill.vendorName.length > 0 ? bill.vendorName : '—'}
                </TableCell>
                <TableCell>
                  <PurchaseBillStatusBadge status={bill.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatPurchaseBillDate(bill.issueDate)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatPurchaseBillDate(bill.dueDate)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-right">
                  {formatPurchaseBillAmount(bill.grandTotal, bill.currency)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatPurchaseBillAmount(bill.balanceDue, bill.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
