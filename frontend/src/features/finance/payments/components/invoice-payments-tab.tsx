'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/design-system';
import { formatInvoiceAmount } from '@/features/finance/invoices/forms/invoice-form.validation';
import type { InvoicePaymentSummary } from '@/features/finance/payments/api/payment.types';
import { PaymentListTable } from '@/features/finance/payments/components/payment-list-table';
import { RecordPaymentDrawer } from '@/features/finance/payments/components/record-payment-drawer';
import {
  useInvoicePaymentSummary,
  useInvoicePayments,
} from '@/features/finance/payments/hooks/use-invoice-payments';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

interface InvoicePaymentsTabProps {
  readonly invoiceId: string;
  readonly canRecord?: boolean;
  /** When provided by the parent, skips a duplicate summary query. */
  readonly summary?: InvoicePaymentSummary;
}

export function InvoicePaymentsTab({
  invoiceId,
  canRecord = true,
  summary: summaryProp,
}: InvoicePaymentsTabProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: payments = [], isLoading, error, refetch } = useInvoicePayments(invoiceId);
  const {
    data: summaryFromQuery,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useInvoicePaymentSummary(invoiceId, {
    enabled: summaryProp === undefined,
  });

  const summary = summaryProp ?? summaryFromQuery;

  if (isLoading || (summaryProp === undefined && isSummaryLoading)) {
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
              void refetch();
            }}
          >
            Try again
          </Button>
        }
      />
    );
  }

  if (summaryProp === undefined && (isSummaryError || summary === undefined)) {
    return (
      <ErrorState
        message={extractApiErrorMessage(summaryError)}
        action={
          <Button
            variant="outline"
            onClick={() => {
              void refetchSummary();
            }}
          >
            Try again
          </Button>
        }
      />
    );
  }

  if (summary === undefined) {
    return <LoadingState label="Loading payments..." />;
  }

  const outstanding = summary.outstandingAmount;
  const currency = summary.currency;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-1 text-lg font-semibold">
            {formatInvoiceAmount(summary.grandTotal, currency)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Paid</p>
          <p className="mt-1 text-lg font-semibold">
            {formatInvoiceAmount(summary.amountPaid, currency)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-lg font-semibold">
            {formatInvoiceAmount(summary.outstandingAmount, currency)}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        {canRecord && outstanding > 0 ? (
          <Can permission="invoices.update" mode="hide">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              Record payment
            </Button>
          </Can>
        ) : null}
      </div>

      {payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Record a payment to update the outstanding balance."
        />
      ) : (
        <PaymentListTable payments={payments} />
      )}

      <RecordPaymentDrawer
        open={drawerOpen}
        invoiceId={invoiceId}
        currency={currency}
        outstandingAmount={outstanding}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
