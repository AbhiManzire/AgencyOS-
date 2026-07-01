'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, PageContainer } from '@/design-system';
import { CreateQuoteDrawer } from '@/features/sales/quotes/components/create-quote-drawer';
import { QuoteDetailHeader } from '@/features/sales/quotes/components/quote-detail-header';
import { QuoteDetailOverviewCard } from '@/features/sales/quotes/components/quote-detail-overview-card';
import { QuoteDetailTabs } from '@/features/sales/quotes/components/quote-detail-tabs';
import { QuoteNotFoundState } from '@/features/sales/quotes/components/quote-not-found-state';
import { QuoteLineItemsTab } from '@/features/sales/quote-line-items/components/quote-line-items-tab';
import { useQuote } from '@/features/sales/quotes/hooks/use-quote';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const quoteId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const { data: quote, isLoading, error, refetch } = useQuote(quoteId);

  if (isLoading) {
    return (
      <PageContainer size="lg">
        <LoadingState label="Loading quote..." />
      </PageContainer>
    );
  }

  if (error) {
    if (isApiNotFoundError(error)) {
      return <QuoteNotFoundState />;
    }

    return (
      <PageContainer size="lg">
        <ErrorState
          message={extractApiErrorMessage(error)}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!quote) {
    return <QuoteNotFoundState />;
  }

  return (
    <PageContainer size="lg">
      <QuoteDetailHeader
        quote={quote}
        onEdit={() => {
          setEditDrawerOpen(true);
        }}
      />

      <CreateQuoteDrawer
        open={editDrawerOpen}
        mode="edit"
        quoteId={quoteId}
        onOpenChange={setEditDrawerOpen}
      />

      <QuoteDetailTabs
        lineItems={<QuoteLineItemsTab quoteId={quoteId} currency={quote.currency} />}
        overview={<QuoteDetailOverviewCard quote={quote} />}
      />
    </PageContainer>
  );
}
