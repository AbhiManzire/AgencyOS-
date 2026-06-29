'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/design-system';
import { CardTitle } from '@/design-system/typography';
import { calculateQuotePricingSummary } from '@/features/sales/pricing/pricing-engine';
import { formatQuoteAmount } from '@/features/sales/quotes/forms/quote-form.validation';
import { useQuoteLineItems } from '@/features/sales/quote-line-items/hooks/use-quote-line-items';
import {
  PROPOSAL_SECTION_KEYS,
  PROPOSAL_SECTION_LABELS,
  type ProposalSections,
} from '@/features/sales/proposals/proposal-sections';

interface ProposalPreviewProps {
  readonly title: string;
  readonly sections: ProposalSections;
  readonly quoteId: string | null;
  readonly currency?: string;
}

function SectionPreview({
  label,
  html,
  fallback,
}: {
  readonly label: string;
  readonly html: string;
  readonly fallback?: string;
}) {
  const hasContent = html.trim().length > 0;

  return (
    <section className="space-y-2 border-b border-border pb-6 last:border-b-0 last:pb-0">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      {hasContent ? (
        <div
          className="prose prose-sm max-w-none text-foreground [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{fallback ?? 'No content yet.'}</p>
      )}
    </section>
  );
}

export function ProposalPreview({
  title,
  sections,
  quoteId,
  currency = 'USD',
}: ProposalPreviewProps) {
  const { data: lineItems = [] } = useQuoteLineItems(quoteId ?? '', {
    enabled: quoteId !== null && quoteId.length > 0,
  });

  const pricingSummary = useMemo(() => calculateQuotePricingSummary(lineItems), [lineItems]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        </div>

        {PROPOSAL_SECTION_KEYS.map((sectionKey) => {
          if (sectionKey === 'pricing' && quoteId !== null && lineItems.length > 0) {
            return (
              <section
                key={sectionKey}
                className="space-y-3 border-b border-border pb-6 last:border-b-0 last:pb-0"
              >
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {PROPOSAL_SECTION_LABELS.pricing}
                </h3>
                {sections.pricing.trim().length > 0 ? (
                  <div
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: sections.pricing }}
                  />
                ) : null}
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatQuoteAmount(pricingSummary.subtotal, currency)}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-4">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-{formatQuoteAmount(pricingSummary.discountTotal, currency)}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-4">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatQuoteAmount(pricingSummary.taxTotal, currency)}</span>
                  </div>
                  <div className="mt-3 flex justify-between gap-4 border-t border-border pt-3 font-semibold">
                    <span>Grand Total</span>
                    <span>{formatQuoteAmount(pricingSummary.grandTotal, currency)}</span>
                  </div>
                </div>
              </section>
            );
          }

          return (
            <SectionPreview
              key={sectionKey}
              label={PROPOSAL_SECTION_LABELS[sectionKey]}
              html={sections[sectionKey]}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
