'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { formatPurchaseBillAmount } from '@/features/finance/purchases/forms/purchase-bill-form.validation';
import { PurchasePaymentListTable } from '@/features/finance/purchases/components/purchase-payment-list-table';
import { RecordPurchasePaymentDrawer } from '@/features/finance/purchases/components/record-purchase-payment-drawer';
import { usePurchaseBillPayments } from '@/features/finance/purchases/hooks/use-purchase-payments';
import { useVoidPurchasePayment } from '@/features/finance/purchases/hooks/use-void-purchase-payment';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';
import { usePermission } from '@/lib/rbac/use-permission';

interface PurchasePaymentsTabProps {
  readonly billId: string;
  readonly currency: string;
  readonly grandTotal: number;
  readonly balanceDue: number;
  readonly canRecord?: boolean;
}

export function PurchasePaymentsTab({
  billId,
  currency,
  grandTotal,
  balanceDue,
  canRecord = true,
}: PurchasePaymentsTabProps) {
  const { showToast } = useToast();
  const { allowed: canManage } = usePermission('finance.purchases.update');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: payments = [], isLoading, error, refetch } = usePurchaseBillPayments(billId);
  const { mutateAsync: voidPayment, isPending: isVoiding } = useVoidPurchasePayment();

  const amountPaid = useMemo(() => {
    return payments
      .filter((payment) => payment.status === 'COMPLETED')
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [payments]);

  const outstanding = balanceDue;

  const handleVoid = async (paymentId: string): Promise<void> => {
    try {
      await voidPayment(paymentId);
      showToast('Payment voided', 'success');
    } catch (voidError) {
      showToast(extractApiErrorMessage(voidError), 'error');
    }
  };

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
              void refetch();
            }}
          >
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-1 text-lg font-semibold">
            {formatPurchaseBillAmount(grandTotal, currency)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Paid</p>
          <p className="mt-1 text-lg font-semibold">
            {formatPurchaseBillAmount(amountPaid, currency)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-lg font-semibold">
            {formatPurchaseBillAmount(outstanding, currency)}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        {canRecord && outstanding > 0 ? (
          <Can permission="finance.purchases.update" mode="hide">
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
        <PurchasePaymentListTable
          payments={payments}
          canVoid={canManage && !isVoiding}
          onVoidPayment={(paymentId) => {
            void handleVoid(paymentId);
          }}
        />
      )}

      <RecordPurchasePaymentDrawer
        open={drawerOpen}
        billId={billId}
        currency={currency}
        outstandingAmount={outstanding}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
