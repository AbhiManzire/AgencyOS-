'use client';

import { Card, CardContent, CardHeader } from '@/design-system';
import { CardTitle, Caption } from '@/design-system/typography';
import { calculateQuotePricingSummary } from '@/features/sales/pricing/pricing-engine';
import { formatPurchaseBillAmount } from '@/features/finance/purchases/forms/purchase-bill-form.validation';
import type { PurchaseBillLineItemListItem } from '@/features/finance/purchases/types';

interface PurchaseLineItemSummaryCardProps {
  readonly lineItems: readonly PurchaseBillLineItemListItem[];
  readonly currency: string;
}

export function PurchaseLineItemSummaryCard({
  lineItems,
  currency,
}: PurchaseLineItemSummaryCardProps) {
  const summary = calculateQuotePricingSummary(lineItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Caption className="text-muted-foreground">Subtotal</Caption>
          <span className="text-sm font-medium">
            {formatPurchaseBillAmount(summary.subtotal, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Caption className="text-muted-foreground">Discount</Caption>
          <span className="text-sm font-medium text-danger">
            -{formatPurchaseBillAmount(summary.discountTotal, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Caption className="text-muted-foreground">Tax</Caption>
          <span className="text-sm font-medium">
            {formatPurchaseBillAmount(summary.taxTotal, currency)}
          </span>
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold">Grand Total</span>
            <span className="text-lg font-semibold">
              {formatPurchaseBillAmount(summary.grandTotal, currency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
