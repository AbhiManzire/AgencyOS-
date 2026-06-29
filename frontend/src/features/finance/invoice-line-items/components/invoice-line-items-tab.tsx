'use client';

import { ListOrdered, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { DeleteInvoiceLineItemDialog } from '@/features/finance/invoice-line-items/components/delete-invoice-line-item-dialog';
import { InvoiceLineItemDrawer } from '@/features/finance/invoice-line-items/components/invoice-line-item-drawer';
import { InvoiceLineItemTable } from '@/features/finance/invoice-line-items/components/invoice-line-item-table';
import { InvoiceSummaryCard } from '@/features/finance/invoice-line-items/components/invoice-summary-card';
import {
  toCreateLineItemPayload,
  toUpdateLineItemPayload,
} from '@/features/finance/invoice-line-items/forms/line-item-form.validation';
import { useCreateInvoiceLineItem } from '@/features/finance/invoice-line-items/hooks/use-create-invoice-line-item';
import { useDeleteInvoiceLineItem } from '@/features/finance/invoice-line-items/hooks/use-delete-invoice-line-item';
import { useInvoiceLineItems } from '@/features/finance/invoice-line-items/hooks/use-invoice-line-items';
import { useUpdateInvoiceLineItem } from '@/features/finance/invoice-line-items/hooks/use-update-invoice-line-item';
import type { LineItemFormValues } from '@/features/finance/invoice-line-items/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { usePermission } from '@/lib/rbac/use-permission';

interface InvoiceLineItemsTabProps {
  readonly invoiceId: string;
  readonly currency: string;
}

export function InvoiceLineItemsTab({ invoiceId, currency }: InvoiceLineItemsTabProps) {
  const { showToast } = useToast();
  const { allowed: canManage } = usePermission('invoices.update');
  const { data: lineItems = [], isLoading, error, refetch } = useInvoiceLineItems(invoiceId);
  const { mutateAsync: createLineItem, isPending: isCreating } =
    useCreateInvoiceLineItem(invoiceId);
  const { mutateAsync: updateLineItem, isPending: isUpdating } =
    useUpdateInvoiceLineItem(invoiceId);
  const { mutateAsync: deleteLineItem, isPending: isDeleting } =
    useDeleteInvoiceLineItem(invoiceId);

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

  const handleSave = async (values: LineItemFormValues): Promise<void> => {
    if (drawerMode === 'edit' && activeLineItemId !== null) {
      await updateLineItem({
        lineItemId: activeLineItemId,
        payload: toUpdateLineItemPayload(values),
      });
      return;
    }

    await createLineItem(toCreateLineItemPayload(values));
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
          description="Add your first line item to build this invoice."
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
          <InvoiceLineItemTable
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
          <InvoiceSummaryCard lineItems={lineItems} currency={currency} />
        </div>
      )}

      <InvoiceLineItemDrawer
        open={drawerOpen}
        mode={drawerMode}
        currency={currency}
        lineItem={activeLineItem}
        isPending={isCreating || isUpdating}
        onOpenChange={setDrawerOpen}
        onSave={handleSave}
      />

      <DeleteInvoiceLineItemDialog
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
