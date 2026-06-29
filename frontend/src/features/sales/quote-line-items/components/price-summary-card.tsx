'use client';

import { Card, CardContent, CardHeader } from '@/design-system';
import { CardTitle, Caption } from '@/design-system/typography';
import { calculateQuotePricingSummary } from '@/features/sales/pricing/pricing-engine';
import { formatQuoteAmount } from '@/features/sales/quotes/forms/quote-form.validation';
import type { QuoteLineItemListItem } from '@/features/sales/quote-line-items/types';

interface PriceSummaryCardProps {
  readonly lineItems: readonly QuoteLineItemListItem[];
  readonly currency: string;
}

export function PriceSummaryCard({ lineItems, currency }: PriceSummaryCardProps) {
  const summary = calculateQuotePricingSummary(lineItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Caption className="text-muted-foreground">Subtotal</Caption>
          <span className="text-sm font-medium">
            {formatQuoteAmount(summary.subtotal, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Caption className="text-muted-foreground">Discount</Caption>
          <span className="text-sm font-medium text-danger">
            -{formatQuoteAmount(summary.discountTotal, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Caption className="text-muted-foreground">Tax</Caption>
          <span className="text-sm font-medium">
            {formatQuoteAmount(summary.taxTotal, currency)}
          </span>
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold">Grand Total</span>
            <span className="text-lg font-semibold">
              {formatQuoteAmount(summary.grandTotal, currency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
