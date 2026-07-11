import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, CardTitle, Caption } from '@/design-system/typography';
import type { PurchaseBillRecord } from '@/features/finance/purchases/api/purchase-bill.types';
import {
  formatPurchaseBillAmount,
  formatPurchaseBillDate,
  PURCHASE_BILL_STATUS_LABELS,
} from '@/features/finance/purchases/forms/purchase-bill-form.validation';

interface PurchaseBillDetailOverviewCardProps {
  readonly bill: PurchaseBillRecord;
  readonly vendorName?: string;
}

export function PurchaseBillDetailOverviewCard({
  bill,
  vendorName,
}: PurchaseBillDetailOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Caption className="block uppercase tracking-wide">Bill Number</Caption>
            <Body className="font-medium">{bill.billNumber}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Status</Caption>
            <Body>{PURCHASE_BILL_STATUS_LABELS[bill.status]}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Vendor</Caption>
            <Body>{vendorName && vendorName.length > 0 ? vendorName : bill.vendorId}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Currency</Caption>
            <Body>{bill.currency}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Issue Date</Caption>
            <Body>{formatPurchaseBillDate(bill.issueDate)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Due Date</Caption>
            <Body>{formatPurchaseBillDate(bill.dueDate)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Subtotal</Caption>
            <Body>{formatPurchaseBillAmount(bill.subtotal, bill.currency)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Tax</Caption>
            <Body>{formatPurchaseBillAmount(bill.taxAmount, bill.currency)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Grand total</Caption>
            <Body className="font-medium">
              {formatPurchaseBillAmount(bill.grandTotal, bill.currency)}
            </Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Balance due</Caption>
            <Body className="font-medium">
              {formatPurchaseBillAmount(bill.balanceDue, bill.currency)}
            </Body>
          </div>
        </div>

        {bill.notes ? (
          <div>
            <Caption className="mb-2 block uppercase tracking-wide">Notes</Caption>
            <Body className="whitespace-pre-wrap text-muted-foreground">{bill.notes}</Body>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
