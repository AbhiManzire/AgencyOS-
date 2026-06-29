'use client';

import { ListOrdered, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { DeleteLineItemDialog } from '@/features/sales/quote-line-items/components/delete-line-item-dialog';
import { LineItemDrawer } from '@/features/sales/quote-line-items/components/line-item-drawer';
import { LineItemTable } from '@/features/sales/quote-line-items/components/line-item-table';
import { PriceSummaryCard } from '@/features/sales/quote-line-items/components/price-summary-card';
import {
  toCreateLineItemPayload,
  toUpdateLineItemPayload,
} from '@/features/sales/quote-line-items/forms/line-item-form.validation';
import { useCreateQuoteLineItem } from '@/features/sales/quote-line-items/hooks/use-create-quote-line-item';
import { useDeleteQuoteLineItem } from '@/features/sales/quote-line-items/hooks/use-delete-quote-line-item';
import { useQuoteLineItems } from '@/features/sales/quote-line-items/hooks/use-quote-line-items';
import { useUpdateQuoteLineItem } from '@/features/sales/quote-line-items/hooks/use-update-quote-line-item';
import type { LineItemFormValues } from '@/features/sales/quote-line-items/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { usePermission } from '@/lib/rbac/use-permission';

interface QuoteLineItemsTabProps {
  readonly quoteId: string;
  readonly currency: string;
}

export function QuoteLineItemsTab({ quoteId, currency }: QuoteLineItemsTabProps) {
  const { showToast } = useToast();
  const { allowed: canManage } = usePermission('quotes.update');
  const { data: lineItems = [], isLoading, error, refetch } = useQuoteLineItems(quoteId);
  const { mutateAsync: createLineItem, isPending: isCreating } = useCreateQuoteLineItem(quoteId);
  const { mutateAsync: updateLineItem, isPending: isUpdating } = useUpdateQuoteLineItem(quoteId);
  const { mutateAsync: deleteLineItem, isPending: isDeleting } = useDeleteQuoteLineItem(quoteId);

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
          description="Add your first line item to build this quote."
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
          <LineItemTable
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
          <PriceSummaryCard lineItems={lineItems} currency={currency} />
        </div>
      )}

      <LineItemDrawer
        open={drawerOpen}
        mode={drawerMode}
        currency={currency}
        lineItem={activeLineItem}
        isPending={isCreating || isUpdating}
        onOpenChange={setDrawerOpen}
        onSave={handleSave}
      />

      <DeleteLineItemDialog
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
