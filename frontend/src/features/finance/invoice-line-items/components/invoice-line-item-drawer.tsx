'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import {
  areLineItemFormValuesEqual,
  calculateFormLineTotal,
  DEFAULT_LINE_ITEM_FORM_VALUES,
  lineItemToFormValues,
  validateLineItemForm,
} from '@/features/finance/invoice-line-items/forms/line-item-form.validation';
import { formatInvoiceAmount } from '@/features/finance/invoices/forms/invoice-form.validation';
import type {
  LineItemDrawerMode,
  LineItemFormErrors,
  LineItemFormValues,
  InvoiceLineItemListItem,
} from '@/features/finance/invoice-line-items/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface InvoiceLineItemDrawerProps {
  readonly open: boolean;
  readonly mode: LineItemDrawerMode;
  readonly currency: string;
  readonly lineItem?: InvoiceLineItemListItem;
  readonly isPending?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (values: LineItemFormValues) => Promise<void>;
}

export function InvoiceLineItemDrawer({
  open,
  mode,
  currency,
  lineItem,
  isPending = false,
  onOpenChange,
  onSave,
}: InvoiceLineItemDrawerProps) {
  const { showToast } = useToast();
  const [values, setValues] = useState<LineItemFormValues>(DEFAULT_LINE_ITEM_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<LineItemFormValues>(
    DEFAULT_LINE_ITEM_FORM_VALUES,
  );
  const [errors, setErrors] = useState<LineItemFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSaving = isPending || isSubmitting;
  const isEditMode = mode === 'edit';
  const isDirty = useMemo(
    () => !areLineItemFormValuesEqual(values, initialValues),
    [initialValues, values],
  );
  const previewTotal = useMemo(() => calculateFormLineTotal(values), [values]);

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode && lineItem !== undefined) {
      const formValues = lineItemToFormValues(lineItem);
      setValues(formValues);
      setInitialValues(formValues);
    } else {
      setValues(DEFAULT_LINE_ITEM_FORM_VALUES);
      setInitialValues(DEFAULT_LINE_ITEM_FORM_VALUES);
    }

    setErrors({});
  }, [lineItem, isEditMode, open]);

  const updateField = <K extends keyof LineItemFormValues>(
    field: K,
    value: LineItemFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const handleCloseRequest = (): void => {
    if (isSaving) {
      return;
    }

    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }

    onOpenChange(false);
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const validationErrors = validateLineItemForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(values);
      showToast(isEditMode ? 'Line item updated' : 'Line item added', 'success');
      onOpenChange(false);
    } catch (saveError) {
      showToast(extractApiErrorMessage(saveError), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleCloseRequest();
            return;
          }
          onOpenChange(nextOpen);
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-6 pb-6">
              <SectionTitle>{isEditMode ? 'Edit Line Item' : 'Add Line Item'}</SectionTitle>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="invoice-line-item-name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="invoice-line-item-name"
                    value={values.name}
                    disabled={isSaving}
                    onChange={(event) => {
                      updateField('name', event.target.value);
                    }}
                  />
                  {errors.name ? <p className="text-sm text-danger">{errors.name}</p> : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="invoice-line-item-description" className="text-sm font-medium">
                    Description
                  </label>
                  <Input
                    id="invoice-line-item-description"
                    value={values.description}
                    disabled={isSaving}
                    onChange={(event) => {
                      updateField('description', event.target.value);
                    }}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="invoice-line-item-quantity" className="text-sm font-medium">
                      Quantity
                    </label>
                    <Input
                      id="invoice-line-item-quantity"
                      type="number"
                      min="0"
                      step="any"
                      value={values.quantity}
                      disabled={isSaving}
                      onChange={(event) => {
                        updateField('quantity', event.target.value);
                      }}
                    />
                    {errors.quantity ? (
                      <p className="text-sm text-danger">{errors.quantity}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="invoice-line-item-unit" className="text-sm font-medium">
                      Unit
                    </label>
                    <Input
                      id="invoice-line-item-unit"
                      value={values.unit}
                      placeholder="e.g. hours"
                      disabled={isSaving}
                      onChange={(event) => {
                        updateField('unit', event.target.value);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="invoice-line-item-unit-price" className="text-sm font-medium">
                    Unit Price
                  </label>
                  <Input
                    id="invoice-line-item-unit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={values.unitPrice}
                    disabled={isSaving}
                    onChange={(event) => {
                      updateField('unitPrice', event.target.value);
                    }}
                  />
                  {errors.unitPrice ? (
                    <p className="text-sm text-danger">{errors.unitPrice}</p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="invoice-line-item-discount" className="text-sm font-medium">
                      Discount
                    </label>
                    <Input
                      id="invoice-line-item-discount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={values.discount}
                      disabled={isSaving}
                      onChange={(event) => {
                        updateField('discount', event.target.value);
                      }}
                    />
                    {errors.discount ? (
                      <p className="text-sm text-danger">{errors.discount}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="invoice-line-item-tax" className="text-sm font-medium">
                      Tax
                    </label>
                    <Input
                      id="invoice-line-item-tax"
                      type="number"
                      min="0"
                      step="0.01"
                      value={values.tax}
                      disabled={isSaving}
                      onChange={(event) => {
                        updateField('tax', event.target.value);
                      }}
                    />
                    {errors.tax ? <p className="text-sm text-danger">{errors.tax}</p> : null}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Line total</p>
                  <p className="text-lg font-semibold">
                    {formatInvoiceAmount(previewTotal, currency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={handleCloseRequest}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEditMode ? 'Save Changes' : 'Add Item'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <UnsavedChangesDialog
        open={showDiscardConfirm}
        onCancel={() => {
          setShowDiscardConfirm(false);
        }}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
