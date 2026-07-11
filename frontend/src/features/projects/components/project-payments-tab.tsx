'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/design-system';
import { useInvoices } from '@/features/finance/invoices/hooks/use-invoices';
import {
  formatInvoiceAmount,
  formatInvoiceDate,
} from '@/features/finance/invoices/forms/invoice-form.validation';
import { PAYMENT_METHOD_LABELS } from '@/features/finance/payments/api/payment.types';
import { PaymentStatusBadge } from '@/features/finance/payments/components/payment-status-badge';
import { usePayments } from '@/features/finance/payments/hooks/use-payments';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface ProjectPaymentsTabProps {
  readonly projectId: string;
}

export function ProjectPaymentsTab({ projectId }: ProjectPaymentsTabProps) {
  const {
    data: invoicesData,
    isLoading: isLoadingInvoices,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices({ projectId, take: 100 });

  const invoiceIds = useMemo(
    () => new Set((invoicesData?.items ?? []).map((invoice) => invoice.id)),
    [invoicesData?.items],
  );

  const {
    data: paymentsData,
    isLoading: isLoadingPayments,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePayments({ take: 100 });

  const isLoading = isLoadingInvoices || isLoadingPayments;
  const error = invoicesError ?? paymentsError;

  if (isLoading) {
    return <LoadingState label="Loading payments..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button
            variant="outline"
            onClick={() => {
              void refetchInvoices();
              void refetchPayments();
            }}
          >
            Try again
          </Button>
        }
      />
    );
  }

  const payments = (paymentsData?.items ?? []).filter((payment) =>
    invoiceIds.has(payment.invoiceId),
  );

  if (invoiceIds.size === 0) {
    return (
      <EmptyState
        title="No project invoices"
        description="Create an invoice for this project to record payments."
        action={
          <Button variant="outline" asChild>
            <Link href="/finance/invoices">Go to invoices</Link>
          </Button>
        }
      />
    );
  }

  if (payments.length === 0) {
    return (
      <EmptyState
        title="No payments yet"
        description="No payments have been recorded against this project's invoices."
        action={
          <Button variant="outline" asChild>
            <Link href="/finance/payments">View all payments</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link href="/finance/payments">All payments</Link>
        </Button>
      </div>
      <ul className="divide-y divide-border rounded-md border border-border">
        {payments.map((payment) => (
          <li key={payment.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0 space-y-1">
              <Link
                href={`/finance/payments/${payment.id}`}
                className="truncate font-medium text-foreground hover:underline"
              >
                {formatInvoiceDate(payment.paidAt)} · {PAYMENT_METHOD_LABELS[payment.method]}
              </Link>
              <p className="text-xs text-muted-foreground">
                <Link href={`/finance/invoices/${payment.invoiceId}`} className="hover:underline">
                  {payment.invoiceNumber}
                </Link>
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-medium">
                {formatInvoiceAmount(payment.amount, payment.currency)}
              </span>
              <PaymentStatusBadge status={payment.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
