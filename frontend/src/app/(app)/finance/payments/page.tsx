'use client';

import Link from 'next/link';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { Button } from '@/components/ui/button';
import { PaymentListTable } from '@/features/finance/payments/components/payment-list-table';
import { usePayments } from '@/features/finance/payments/hooks/use-payments';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export default function PaymentsPage() {
  const { data, isLoading, error, refetch } = usePayments({ take: 50 });

  if (isLoading) {
    return (
      <PageContainer size="lg">
        <LoadingState label="Loading payments..." />
      </PageContainer>
    );
  }

  if (error) {
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

  const payments = data?.items ?? [];

  return (
    <PageContainer size="lg">
      <PageHeader
        title="Payments"
        description="Recorded invoice payments for this workspace."
        actions={
          <Button variant="outline" asChild>
            <Link href="/finance/invoices">View invoices</Link>
          </Button>
        }
      />

      {payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Record a payment from an invoice detail page."
          action={
            <Button asChild>
              <Link href="/finance/invoices">Open invoices</Link>
            </Button>
          }
        />
      ) : (
        <PaymentListTable payments={payments} />
      )}
    </PageContainer>
  );
}
