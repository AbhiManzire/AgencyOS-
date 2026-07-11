'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, PageContainer } from '@/design-system';
import { CreatePurchaseBillDrawer } from '@/features/finance/purchases/components/create-purchase-bill-drawer';
import { PurchaseBillDetailHeader } from '@/features/finance/purchases/components/purchase-bill-detail-header';
import { PurchaseBillDetailOverviewCard } from '@/features/finance/purchases/components/purchase-bill-detail-overview-card';
import { PurchaseBillDetailTabs } from '@/features/finance/purchases/components/purchase-bill-detail-tabs';
import { PurchaseBillNotFoundState } from '@/features/finance/purchases/components/purchase-bill-not-found-state';
import { usePurchaseBill } from '@/features/finance/purchases/hooks/use-purchase-bill';
import { useVendors } from '@/features/finance/vendors/hooks/use-vendors';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';

const PurchaseLineItemsTab = dynamic(
  () =>
    import('@/features/finance/purchases/components/purchase-line-items-tab').then((mod) => ({
      default: mod.PurchaseLineItemsTab,
    })),
  { loading: () => <LoadingState label="Loading line items..." /> },
);

const PurchasePaymentsTab = dynamic(
  () =>
    import('@/features/finance/purchases/components/purchase-payments-tab').then((mod) => ({
      default: mod.PurchasePaymentsTab,
    })),
  { loading: () => <LoadingState label="Loading payments..." /> },
);

export default function PurchaseBillDetailPage() {
  const params = useParams<{ id: string }>();
  const billId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const { data: bill, isLoading, error, refetch } = usePurchaseBill(billId);
  const { data: vendorsData } = useVendors({ take: 100 }, { enabled: bill !== undefined });

  const vendorName = useMemo(() => {
    if (bill === undefined) {
      return '';
    }
    return vendorsData?.items.find((vendor) => vendor.id === bill.vendorId)?.name ?? '';
  }, [bill, vendorsData?.items]);

  if (isLoading) {
    return (
      <PageContainer size="lg">
        <LoadingState label="Loading purchase bill..." />
      </PageContainer>
    );
  }

  if (error) {
    if (isApiNotFoundError(error)) {
      return <PurchaseBillNotFoundState />;
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

  if (!bill) {
    return <PurchaseBillNotFoundState />;
  }

  const canRecordPayment =
    bill.status === 'SENT' ||
    bill.status === 'PARTIALLY_PAID' ||
    bill.status === 'OVERDUE' ||
    bill.status === 'PAID';

  return (
    <PageContainer size="lg">
      <PurchaseBillDetailHeader
        bill={bill}
        vendorName={vendorName}
        onEdit={() => {
          setEditDrawerOpen(true);
        }}
      />

      <CreatePurchaseBillDrawer
        open={editDrawerOpen}
        mode="edit"
        billId={billId}
        onOpenChange={setEditDrawerOpen}
      />

      <PurchaseBillDetailTabs
        lineItems={<PurchaseLineItemsTab billId={billId} currency={bill.currency} />}
        overview={<PurchaseBillDetailOverviewCard bill={bill} vendorName={vendorName} />}
        payments={
          <PurchasePaymentsTab
            billId={billId}
            currency={bill.currency}
            grandTotal={bill.grandTotal}
            balanceDue={bill.balanceDue}
            canRecord={canRecordPayment}
          />
        }
      />
    </PageContainer>
  );
}
