'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Body, Caption } from '@/design-system/typography';
import { Button } from '@/components/ui/button';
import type { QuoteRecord } from '@/features/sales/quotes/api/quote.types';
import { QuoteStatusBadge } from '@/features/sales/quotes/components/quote-status-badge';
import {
  formatQuoteAmount,
  formatQuoteDate,
} from '@/features/sales/quotes/forms/quote-form.validation';

interface QuoteDetailHeaderProps {
  readonly quote: QuoteRecord;
}

export function QuoteDetailHeader({ quote }: QuoteDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6">
      <Button variant="ghost" size="sm" className="w-fit gap-2 px-0" asChild>
        <Link href="/sales/quotes">
          <ArrowLeft className="size-4" />
          Back to quotes
        </Link>
      </Button>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {quote.title}
            </h1>
            <QuoteStatusBadge status={quote.status} />
          </div>

          <p className="text-sm text-muted-foreground">{quote.quoteNumber}</p>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
            <div>
              <Caption className="block uppercase tracking-wide">Client</Caption>
              <Body className="font-medium">{quote.clientName}</Body>
            </div>
            <div>
              <Caption className="block uppercase tracking-wide">Deal</Caption>
              <Body className="text-muted-foreground">{quote.dealTitle}</Body>
            </div>
            <div>
              <Caption className="block uppercase tracking-wide">Valid Until</Caption>
              <Body className="text-muted-foreground">{formatQuoteDate(quote.validUntil)}</Body>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <Caption className="block uppercase tracking-wide">Total</Caption>
          <p className="mt-1 text-2xl font-semibold">
            {formatQuoteAmount(quote.totalAmount, quote.currency)}
          </p>
        </div>
      </div>
    </div>
  );
}
