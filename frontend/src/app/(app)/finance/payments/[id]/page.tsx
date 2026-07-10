'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  ErrorState,
  LoadingState,
  PageContainer,
} from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import {
  formatInvoiceAmount,
  formatInvoiceDate,
} from '@/features/finance/invoices/forms/invoice-form.validation';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/features/finance/payments/api/payment.types';
import { PaymentStatusBadge } from '@/features/finance/payments/components/payment-status-badge';
import { usePayment } from '@/features/finance/payments/hooks/use-payment';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';

export default function PaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const paymentId = params.id;
  const { data: payment, isLoading, error, refetch } = usePayment(paymentId);

  if (isLoading) {
    return (
      <PageContainer size="lg">
        <LoadingState label="Loading payment..." />
      </PageContainer>
    );
  }

  if (error) {
    if (isApiNotFoundError(error)) {
      return (
        <PageContainer size="lg">
          <ErrorState message="Payment not found." />
        </PageContainer>
      );
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

  if (!payment) {
    return (
      <PageContainer size="lg">
        <ErrorState message="Payment not found." />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="lg">
      <Button variant="ghost" size="sm" className="mb-4 w-fit gap-2 px-0" asChild>
        <Link href="/finance/payments">
          <ArrowLeft className="size-4" />
          Back to payments
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {formatInvoiceAmount(payment.amount, payment.currency)}
        </h1>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Caption className="block uppercase tracking-wide">Invoice</Caption>
            <Body>
              <Link
                href={`/finance/invoices/${payment.invoiceId}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {payment.invoiceNumber}
              </Link>
            </Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Client</Caption>
            <Body>{payment.clientName}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Method</Caption>
            <Body>{PAYMENT_METHOD_LABELS[payment.method]}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Status</Caption>
            <Body>{PAYMENT_STATUS_LABELS[payment.status]}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Paid at</Caption>
            <Body>{formatInvoiceDate(payment.paidAt)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Reference</Caption>
            <Body>{payment.reference ?? '—'}</Body>
          </div>
          <div className="sm:col-span-2">
            <Caption className="block uppercase tracking-wide">Notes</Caption>
            <Body>{payment.notes ?? '—'}</Body>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
