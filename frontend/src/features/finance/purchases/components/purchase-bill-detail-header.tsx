'use client';

import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Body, Caption } from '@/design-system/typography';
import { Button } from '@/components/ui/button';
import type { PurchaseBillRecord } from '@/features/finance/purchases/api/purchase-bill.types';
import { PurchaseBillStatusBadge } from '@/features/finance/purchases/components/purchase-bill-status-badge';
import {
  formatPurchaseBillAmount,
  formatPurchaseBillDate,
  PURCHASE_BILL_STATUS_LABELS,
} from '@/features/finance/purchases/forms/purchase-bill-form.validation';
import { Can } from '@/lib/rbac';

interface PurchaseBillDetailHeaderProps {
  readonly bill: PurchaseBillRecord;
  readonly vendorName?: string;
  readonly onEdit: () => void;
}

export function PurchaseBillDetailHeader({
  bill,
  vendorName,
  onEdit,
}: PurchaseBillDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6">
      <Button variant="ghost" size="sm" className="w-fit gap-2 px-0" asChild>
        <Link href="/finance/purchases">
          <ArrowLeft className="size-4" />
          Back to purchases
        </Link>
      </Button>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {bill.billNumber}
            </h1>
            <PurchaseBillStatusBadge status={bill.status} />
          </div>

          <p className="text-sm text-muted-foreground">
            {PURCHASE_BILL_STATUS_LABELS[bill.status]}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
            <div>
              <Caption className="block uppercase tracking-wide">Vendor</Caption>
              <Body className="font-medium">
                {vendorName && vendorName.length > 0 ? vendorName : '—'}
              </Body>
            </div>
            <div>
              <Caption className="block uppercase tracking-wide">Issue Date</Caption>
              <Body className="text-muted-foreground">
                {formatPurchaseBillDate(bill.issueDate)}
              </Body>
            </div>
            <div>
              <Caption className="block uppercase tracking-wide">Due Date</Caption>
              <Body className="text-muted-foreground">{formatPurchaseBillDate(bill.dueDate)}</Body>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          <div>
            <Caption className="block uppercase tracking-wide">Total</Caption>
            <p className="mt-1 text-2xl font-semibold">
              {formatPurchaseBillAmount(bill.grandTotal, bill.currency)}
            </p>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Balance due</Caption>
            <p className="mt-1 text-lg font-medium">
              {formatPurchaseBillAmount(bill.balanceDue, bill.currency)}
            </p>
          </div>
          <Can permission="finance.purchases.update" mode="disable">
            <Button type="button" variant="outline" className="mt-2 gap-2" onClick={onEdit}>
              <Pencil className="size-4" />
              Edit
            </Button>
          </Can>
        </div>
      </div>
    </div>
  );
}
