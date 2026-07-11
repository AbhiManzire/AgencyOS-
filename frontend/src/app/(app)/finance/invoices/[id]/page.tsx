'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, PageContainer } from '@/design-system';
import { CreateInvoiceDrawer } from '@/features/finance/invoices/components/create-invoice-drawer';
import { InvoiceDetailHeader } from '@/features/finance/invoices/components/invoice-detail-header';
import { InvoiceDetailOverviewCard } from '@/features/finance/invoices/components/invoice-detail-overview-card';
import { InvoiceDetailTabs } from '@/features/finance/invoices/components/invoice-detail-tabs';
import { InvoiceNotFoundState } from '@/features/finance/invoices/components/invoice-not-found-state';
import { useInvoice } from '@/features/finance/invoices/hooks/use-invoice';
import { useInvoiceLineItems } from '@/features/finance/invoice-line-items/hooks/use-invoice-line-items';
import { useInvoicePaymentSummary } from '@/features/finance/payments/hooks/use-invoice-payments';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';

const InvoiceLineItemsTab = dynamic(
  () =>
    import('@/features/finance/invoice-line-items/components/invoice-line-items-tab').then(
      (mod) => ({ default: mod.InvoiceLineItemsTab }),
    ),
  { loading: () => <LoadingState label="Loading line items..." /> },
);

const InvoicePaymentsTab = dynamic(
  () =>
    import('@/features/finance/payments/components/invoice-payments-tab').then((mod) => ({
      default: mod.InvoicePaymentsTab,
    })),
  { loading: () => <LoadingState label="Loading payments..." /> },
);

const InvoiceHistoryTab = dynamic(
  () =>
    import('@/features/finance/invoices/components/invoice-history-tab').then((mod) => ({
      default: mod.InvoiceHistoryTab,
    })),
  { loading: () => <LoadingState label="Loading history..." /> },
);

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const { data: invoice, isLoading, error, refetch } = useInvoice(invoiceId);
  const { data: lineItems = [] } = useInvoiceLineItems(invoiceId, {
    enabled: invoice !== undefined,
  });
  const { data: paymentSummary } = useInvoicePaymentSummary(invoiceId, {
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

  const canRecordPayment =
    invoice.status === 'SENT' ||
    invoice.status === 'VIEWED' ||
    invoice.status === 'PARTIALLY_PAID' ||
    invoice.status === 'OVERDUE' ||
    invoice.status === 'PAID';

  return (
    <PageContainer size="lg">
      <InvoiceDetailHeader
        invoice={invoice}
        lineItems={lineItems}
        amountPaid={paymentSummary?.amountPaid}
        outstandingAmount={paymentSummary?.outstandingAmount}
        onEdit={() => {
          setEditDrawerOpen(true);
        }}
      />

      <CreateInvoiceDrawer
        open={editDrawerOpen}
        mode="edit"
        invoiceId={invoiceId}
        onOpenChange={setEditDrawerOpen}
      />

      <InvoiceDetailTabs
        lineItems={<InvoiceLineItemsTab invoiceId={invoiceId} currency={invoice.currency} />}
        overview={<InvoiceDetailOverviewCard invoice={invoice} />}
        payments={
          <InvoicePaymentsTab
            invoiceId={invoiceId}
            canRecord={canRecordPayment}
            summary={paymentSummary}
          />
        }
        history={<InvoiceHistoryTab invoiceId={invoiceId} />}
      />
    </PageContainer>
  );
}
