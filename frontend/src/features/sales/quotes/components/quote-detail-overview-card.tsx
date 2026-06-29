import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, CardTitle, Caption } from '@/design-system/typography';
import type { QuoteRecord } from '@/features/sales/quotes/api/quote.types';
import {
  formatQuoteAmount,
  formatQuoteDate,
  QUOTE_STATUS_LABELS,
} from '@/features/sales/quotes/forms/quote-form.validation';

interface QuoteDetailOverviewCardProps {
  readonly quote: QuoteRecord;
}

export function QuoteDetailOverviewCard({ quote }: QuoteDetailOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Caption className="block uppercase tracking-wide">Quote Number</Caption>
            <Body className="font-medium">{quote.quoteNumber}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Status</Caption>
            <Body>{QUOTE_STATUS_LABELS[quote.status]}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Currency</Caption>
            <Body>{quote.currency}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Valid Until</Caption>
            <Body>{formatQuoteDate(quote.validUntil)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Total Amount</Caption>
            <Body className="font-medium">
              {formatQuoteAmount(quote.totalAmount, quote.currency)}
            </Body>
          </div>
        </div>

        {quote.notes ? (
          <div>
            <Caption className="mb-2 block uppercase tracking-wide">Notes</Caption>
            <Body className="whitespace-pre-wrap text-muted-foreground">{quote.notes}</Body>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
