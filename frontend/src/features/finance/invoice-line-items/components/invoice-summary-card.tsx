'use client';

import { Card, CardContent, CardHeader } from '@/design-system';
import { CardTitle, Caption } from '@/design-system/typography';
import { calculateQuotePricingSummary } from '@/features/sales/pricing/pricing-engine';
import { formatInvoiceAmount } from '@/features/finance/invoices/forms/invoice-form.validation';
import type { InvoiceLineItemListItem } from '@/features/finance/invoice-line-items/types';

interface InvoiceSummaryCardProps {
  readonly lineItems: readonly InvoiceLineItemListItem[];
  readonly currency: string;
}

export function InvoiceSummaryCard({ lineItems, currency }: InvoiceSummaryCardProps) {
  const summary = calculateQuotePricingSummary(lineItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Caption className="text-muted-foreground">Subtotal</Caption>
          <span className="text-sm font-medium">
            {formatInvoiceAmount(summary.subtotal, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Caption className="text-muted-foreground">Discount</Caption>
          <span className="text-sm font-medium text-danger">
            -{formatInvoiceAmount(summary.discountTotal, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Caption className="text-muted-foreground">Tax</Caption>
          <span className="text-sm font-medium">
            {formatInvoiceAmount(summary.taxTotal, currency)}
          </span>
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold">Grand Total</span>
            <span className="text-lg font-semibold">
              {formatInvoiceAmount(summary.grandTotal, currency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
