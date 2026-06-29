'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, PageContainer } from '@/design-system';
import { InvoiceDetailHeader } from '@/features/finance/invoices/components/invoice-detail-header';
import { InvoiceDetailOverviewCard } from '@/features/finance/invoices/components/invoice-detail-overview-card';
import { InvoiceDetailTabs } from '@/features/finance/invoices/components/invoice-detail-tabs';
import { InvoiceHistoryTab } from '@/features/finance/invoices/components/invoice-history-tab';
import { InvoiceNotFoundState } from '@/features/finance/invoices/components/invoice-not-found-state';
import { useInvoice } from '@/features/finance/invoices/hooks/use-invoice';
import { InvoiceLineItemsTab } from '@/features/finance/invoice-line-items/components/invoice-line-items-tab';
import { useInvoiceLineItems } from '@/features/finance/invoice-line-items/hooks/use-invoice-line-items';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;

  const { data: invoice, isLoading, error, refetch } = useInvoice(invoiceId);
  const { data: lineItems = [] } = useInvoiceLineItems(invoiceId, {
    enabled: invoice !== undefined,
  });

  if (isLoading) {
    return (
      <PageContainer size="lg">
        <LoadingState label="Loading invoice..." />
      </PageContainer>
    );
  }

  if (error) {
    if (isApiNotFoundError(error)) {
      return <InvoiceNotFoundState />;
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

  if (!invoice) {
    return <InvoiceNotFoundState />;
  }

  return (
    <PageContainer size="lg">
      <InvoiceDetailHeader invoice={invoice} lineItems={lineItems} />

      <InvoiceDetailTabs
        lineItems={<InvoiceLineItemsTab invoiceId={invoiceId} currency={invoice.currency} />}
        overview={<InvoiceDetailOverviewCard invoice={invoice} />}
        history={<InvoiceHistoryTab invoiceId={invoiceId} />}
      />
    </PageContainer>
  );
}
