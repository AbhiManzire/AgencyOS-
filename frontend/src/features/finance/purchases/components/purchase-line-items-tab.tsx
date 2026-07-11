'use client';

import { ListOrdered, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { DeletePurchaseLineItemDialog } from '@/features/finance/purchases/components/delete-purchase-line-item-dialog';
import { PurchaseLineItemDrawer } from '@/features/finance/purchases/components/purchase-line-item-drawer';
import { PurchaseLineItemSummaryCard } from '@/features/finance/purchases/components/purchase-line-item-summary-card';
import { PurchaseLineItemTable } from '@/features/finance/purchases/components/purchase-line-item-table';
import {
  toCreatePurchaseLineItemPayload,
  toUpdatePurchaseLineItemPayload,
} from '@/features/finance/purchases/forms/purchase-line-item-form.validation';
import { useCreatePurchaseBillLineItem } from '@/features/finance/purchases/hooks/use-create-purchase-line-item';
import { useDeletePurchaseBillLineItem } from '@/features/finance/purchases/hooks/use-delete-purchase-line-item';
import { usePurchaseBillLineItems } from '@/features/finance/purchases/hooks/use-purchase-line-items';
import { useUpdatePurchaseBillLineItem } from '@/features/finance/purchases/hooks/use-update-purchase-line-item';
import type { PurchaseLineItemFormValues } from '@/features/finance/purchases/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { usePermission } from '@/lib/rbac/use-permission';

interface PurchaseLineItemsTabProps {
  readonly billId: string;
  readonly currency: string;
}

export function PurchaseLineItemsTab({ billId, currency }: PurchaseLineItemsTabProps) {
  const { showToast } = useToast();
  const { allowed: canManage } = usePermission('finance.purchases.update');
  const { data: lineItems = [], isLoading, error, refetch } = usePurchaseBillLineItems(billId);
  const { mutateAsync: createLineItem, isPending: isCreating } =
    useCreatePurchaseBillLineItem(billId);
  const { mutateAsync: updateLineItem, isPending: isUpdating } =
    useUpdatePurchaseBillLineItem(billId);
  const { mutateAsync: deleteLineItem, isPending: isDeleting } =
    useDeletePurchaseBillLineItem(billId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeLineItemId, setActiveLineItemId] = useState<string | null>(null);
  const [deleteLineItemId, setDeleteLineItemId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const activeLineItem = useMemo(
    () => lineItems.find((item) => item.id === activeLineItemId),
    [activeLineItemId, lineItems],
  );

  const deleteName = useMemo(() => {
    const item = lineItems.find((entry) => entry.id === deleteLineItemId);
    return item?.name ?? 'this line item';
  }, [deleteLineItemId, lineItems]);

  const openCreateDrawer = (): void => {
    setDrawerMode('create');
    setActiveLineItemId(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (lineItemId: string): void => {
    setDrawerMode('edit');
    setActiveLineItemId(lineItemId);
    setDrawerOpen(true);
  };

  const handleSave = async (values: PurchaseLineItemFormValues): Promise<void> => {
    if (drawerMode === 'edit' && activeLineItemId !== null) {
      await updateLineItem({
        lineItemId: activeLineItemId,
        payload: toUpdatePurchaseLineItemPayload(values),
      });
      return;
    }

    await createLineItem(toCreatePurchaseLineItemPayload(values));
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (deleteLineItemId === null) {
      return;
    }

    try {
      await deleteLineItem(deleteLineItemId);
      showToast('Line item deleted', 'success');
      setDeleteLineItemId(null);
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  const handleMoveLineItem = async (
    lineItemId: string,
    direction: 'up' | 'down',
  ): Promise<void> => {
    const index = lineItems.findIndex((item) => item.id === lineItemId);
    if (index < 0) {
      return;
    }

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= lineItems.length) {
      return;
    }

    const current = lineItems[index];
    const target = lineItems[swapIndex];
    setIsReordering(true);

    try {
      await Promise.all([
        updateLineItem({
          lineItemId: current.id,
          payload: { sortOrder: target.sortOrder },
        }),
        updateLineItem({
          lineItemId: target.id,
          payload: { sortOrder: current.sortOrder },
        }),
      ]);
      showToast('Line items reordered', 'success');
    } catch (reorderError) {
      showToast(extractApiErrorMessage(reorderError), 'error');
    } finally {
      setIsReordering(false);
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading line items..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Line Items</h2>
          <p className="text-sm text-muted-foreground">
            Add products and services with automatic pricing totals.
          </p>
        </div>
        {canManage ? (
          <Button type="button" className="gap-2" onClick={openCreateDrawer}>
            <Plus className="size-4" />
            Add Item
          </Button>
        ) : null}
      </div>

      {lineItems.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No line items yet"
          description="Add your first line item to build this purchase bill."
          action={
            canManage ? (
              <Button type="button" className="gap-2" onClick={openCreateDrawer}>
                <Plus className="size-4" />
                Add Item
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <PurchaseLineItemTable
            lineItems={lineItems}
            currency={currency}
            readOnly={!canManage}
            isReordering={isReordering}
            onEditLineItem={openEditDrawer}
            onDeleteLineItem={setDeleteLineItemId}
            onMoveLineItem={(lineItemId, direction) => {
              void handleMoveLineItem(lineItemId, direction);
            }}
          />
          <PurchaseLineItemSummaryCard lineItems={lineItems} currency={currency} />
        </div>
      )}

      <PurchaseLineItemDrawer
        open={drawerOpen}
        mode={drawerMode}
        currency={currency}
        lineItem={activeLineItem}
        isPending={isCreating || isUpdating}
        onOpenChange={setDrawerOpen}
        onSave={handleSave}
      />

      <DeletePurchaseLineItemDialog
        open={deleteLineItemId !== null}
        name={deleteName}
        isPending={isDeleting}
        onCancel={() => {
          setDeleteLineItemId(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
