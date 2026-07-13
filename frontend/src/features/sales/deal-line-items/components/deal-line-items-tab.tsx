'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import type { DealLineItemRecord } from '@/features/sales/deal-line-items/api/deal-line-item.types';
import {
  DEFAULT_DEAL_LINE_ITEM_FORM_VALUES,
  toCreateDealLineItemPayload,
  toUpdateDealLineItemPayload,
  validateDealLineItemForm,
  type DealLineItemFormErrors,
  type DealLineItemFormValues,
} from '@/features/sales/deal-line-items/forms/deal-line-item-form.validation';
import {
  useCreateDealLineItem,
  useDeleteDealLineItem,
  useUpdateDealLineItem,
} from '@/features/sales/deal-line-items/hooks/use-deal-line-item-mutations';
import { useDealLineItems } from '@/features/sales/deal-line-items/hooks/use-deal-line-items';
import { formatDealValue } from '@/features/sales/utils/deal-display';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

interface DealLineItemsTabProps {
  readonly dealId: string;
  readonly currency: string;
  readonly readOnly?: boolean;
}

function recordToFormValues(item: DealLineItemRecord): DealLineItemFormValues {
  return {
    name: item.name,
    description: item.description ?? '',
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
    discount: String(item.discount),
    tax: String(item.tax),
  };
}

export function DealLineItemsTab({ dealId, currency, readOnly = false }: DealLineItemsTabProps) {
  const { showToast } = useToast();
  const { data: lineItems = [], isLoading, error, refetch } = useDealLineItems(dealId);
  const { mutateAsync: createLineItem, isPending: isCreating } = useCreateDealLineItem(dealId);
  const { mutateAsync: updateLineItem, isPending: isUpdating } = useUpdateDealLineItem(dealId);
  const { mutateAsync: deleteLineItem, isPending: isDeleting } = useDeleteDealLineItem(dealId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [values, setValues] = useState<DealLineItemFormValues>(DEFAULT_DEAL_LINE_ITEM_FORM_VALUES);
  const [errors, setErrors] = useState<DealLineItemFormErrors>({});

  const totals = useMemo(() => {
    return lineItems.reduce(
      (acc, item) => ({
        subtotal: acc.subtotal + item.subtotal,
        total: acc.total + item.total,
      }),
      { subtotal: 0, total: 0 },
    );
  }, [lineItems]);

  const isSaving = isCreating || isUpdating;

  const startCreate = (): void => {
    setEditingId(null);
    setIsCreatingRow(true);
    setValues(DEFAULT_DEAL_LINE_ITEM_FORM_VALUES);
    setErrors({});
  };

  const startEdit = (item: DealLineItemRecord): void => {
    setIsCreatingRow(false);
    setEditingId(item.id);
    setValues(recordToFormValues(item));
    setErrors({});
  };

  const cancelEdit = (): void => {
    setIsCreatingRow(false);
    setEditingId(null);
    setValues(DEFAULT_DEAL_LINE_ITEM_FORM_VALUES);
    setErrors({});
  };

  const handleSave = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const nextErrors = validateDealLineItemForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      if (editingId !== null) {
        await updateLineItem({
          lineItemId: editingId,
          payload: toUpdateDealLineItemPayload(values),
        });
        showToast('Line item updated', 'success');
      } else {
        await createLineItem(toCreateDealLineItemPayload(values));
        showToast('Line item added', 'success');
      }
      cancelEdit();
    } catch (saveError) {
      setErrors({ form: extractApiErrorMessage(saveError) });
    }
  };

  const handleDelete = async (lineItemId: string): Promise<void> => {
    try {
      await deleteLineItem(lineItemId);
      showToast('Line item deleted', 'success');
      if (editingId === lineItemId) {
        cancelEdit();
      }
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading products..." />;
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

  const showEditor = isCreatingRow || editingId !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Products and services on this opportunity.</p>
        {!readOnly ? (
          <Can permission="sales.update" mode="hide">
            <Button
              type="button"
              size="sm"
              className="gap-2"
              disabled={showEditor}
              onClick={startCreate}
            >
              <Plus className="size-4" />
              Add line item
            </Button>
          </Can>
        ) : null}
      </div>

      {lineItems.length === 0 && !showEditor ? (
        <EmptyState
          title="No products yet"
          description="Add line items to track products and pricing on this deal."
          action={
            readOnly ? undefined : (
              <Can permission="sales.update" mode="hide">
                <Button type="button" className="gap-2" onClick={startCreate}>
                  <Plus className="size-4" />
                  Add line item
                </Button>
              </Can>
            )
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Discount</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Tax</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {!readOnly ? <TableHead className="w-24 text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.name}</p>
                      {item.description ? (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDealValue(item.unitPrice, currency)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right tabular-nums">
                      {formatDealValue(item.discount, currency)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right tabular-nums">
                      {formatDealValue(item.tax, currency)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right tabular-nums">
                      {formatDealValue(item.subtotal, currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatDealValue(item.total, currency)}
                    </TableCell>
                    {!readOnly ? (
                      <TableCell className="text-right">
                        <Can permission="sales.update" mode="hide">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={showEditor || isDeleting}
                              onClick={() => {
                                startEdit(item);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-danger"
                              disabled={isDeleting}
                              aria-label={`Delete ${item.name}`}
                              onClick={() => {
                                void handleDelete(item.id);
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </Can>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-6 border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Subtotal {formatDealValue(totals.subtotal, currency)}
            </span>
            <span className="font-medium">Total {formatDealValue(totals.total, currency)}</span>
          </div>
        </div>
      )}

      {showEditor ? (
        <form
          className="space-y-4 rounded-lg border border-border bg-muted/10 p-4"
          onSubmit={(event) => void handleSave(event)}
        >
          {errors.form ? <p className="text-sm text-danger">{errors.form}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="li-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="li-name"
                value={values.name}
                disabled={isSaving}
                onChange={(event) => {
                  setValues((current) => ({ ...current, name: event.target.value }));
                }}
              />
              {errors.name ? <p className="text-xs text-danger">{errors.name}</p> : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="li-description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="li-description"
                value={values.description}
                disabled={isSaving}
                onChange={(event) => {
                  setValues((current) => ({ ...current, description: event.target.value }));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="li-qty" className="text-sm font-medium">
                Qty
              </label>
              <Input
                id="li-qty"
                type="number"
                min={0.0001}
                step="any"
                value={values.quantity}
                disabled={isSaving}
                onChange={(event) => {
                  setValues((current) => ({ ...current, quantity: event.target.value }));
                }}
              />
              {errors.quantity ? <p className="text-xs text-danger">{errors.quantity}</p> : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="li-price" className="text-sm font-medium">
                Price
              </label>
              <Input
                id="li-price"
                type="number"
                min={0}
                step="0.01"
                value={values.unitPrice}
                disabled={isSaving}
                onChange={(event) => {
                  setValues((current) => ({ ...current, unitPrice: event.target.value }));
                }}
              />
              {errors.unitPrice ? <p className="text-xs text-danger">{errors.unitPrice}</p> : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="li-discount" className="text-sm font-medium">
                Discount
              </label>
              <Input
                id="li-discount"
                type="number"
                min={0}
                step="0.01"
                value={values.discount}
                disabled={isSaving}
                onChange={(event) => {
                  setValues((current) => ({ ...current, discount: event.target.value }));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="li-tax" className="text-sm font-medium">
                Tax
              </label>
              <Input
                id="li-tax"
                type="number"
                min={0}
                step="0.01"
                value={values.tax}
                disabled={isSaving}
                onChange={(event) => {
                  setValues((current) => ({ ...current, tax: event.target.value }));
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={isSaving} onClick={cancelEdit}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {editingId !== null ? 'Save' : 'Add'}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
