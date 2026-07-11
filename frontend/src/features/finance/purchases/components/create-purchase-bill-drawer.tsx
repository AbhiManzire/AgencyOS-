'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import {
  arePurchaseBillFormValuesEqual,
  DEFAULT_PURCHASE_BILL_FORM_VALUES,
  PURCHASE_BILL_STATUS_LABELS,
  purchaseBillRecordToFormValues,
  toCreatePurchaseBillPayload,
  toUpdatePurchaseBillPayload,
  validatePurchaseBillForm,
} from '@/features/finance/purchases/forms/purchase-bill-form.validation';
import { useCreatePurchaseBill } from '@/features/finance/purchases/hooks/use-create-purchase-bill';
import { usePurchaseBill } from '@/features/finance/purchases/hooks/use-purchase-bill';
import { useUpdatePurchaseBill } from '@/features/finance/purchases/hooks/use-update-purchase-bill';
import type {
  PurchaseBillFormErrors,
  PurchaseBillFormValues,
  PurchaseBillStatus,
} from '@/features/finance/purchases/types';
import { useVendors } from '@/features/finance/vendors/hooks/use-vendors';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export type PurchaseBillDrawerMode = 'create' | 'edit';

interface CreatePurchaseBillDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode?: PurchaseBillDrawerMode;
  readonly billId?: string;
}

export function CreatePurchaseBillDrawer({
  open,
  onOpenChange,
  mode = 'create',
  billId,
}: CreatePurchaseBillDrawerProps) {
  const isEditMode = mode === 'edit' && billId !== undefined && billId.length > 0;
  const { showToast } = useToast();
  const { mutateAsync: createBill, isPending: isCreating } = useCreatePurchaseBill();
  const { mutateAsync: updateBill, isPending: isUpdating } = useUpdatePurchaseBill();
  const {
    data: bill,
    isLoading: isLoadingBill,
    error: loadError,
    refetch: refetchBill,
  } = usePurchaseBill(billId ?? '', { enabled: open && isEditMode });

  const [values, setValues] = useState<PurchaseBillFormValues>(DEFAULT_PURCHASE_BILL_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<PurchaseBillFormValues>(
    DEFAULT_PURCHASE_BILL_FORM_VALUES,
  );
  const [errors, setErrors] = useState<PurchaseBillFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const {
    data: vendorsData,
    isLoading: isLoadingVendors,
    error: vendorsError,
    refetch: refetchVendors,
  } = useVendors({ take: 100 }, { enabled: open });

  const isDirty = useMemo(
    () => !arePurchaseBillFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode) {
      return;
    }

    setValues(DEFAULT_PURCHASE_BILL_FORM_VALUES);
    setInitialValues(DEFAULT_PURCHASE_BILL_FORM_VALUES);
    setErrors({});
  }, [isEditMode, open]);

  useEffect(() => {
    if (!open || !isEditMode || bill === undefined) {
      return;
    }

    const formValues = purchaseBillRecordToFormValues(bill);
    setValues(formValues);
    setInitialValues(formValues);
    setErrors({});
  }, [bill, isEditMode, open]);

  const updateField = <K extends keyof PurchaseBillFormValues>(
    field: K,
    value: PurchaseBillFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const isSaving = isCreating || isUpdating;

  const handleCloseRequest = (nextOpen: boolean): void => {
    if (!nextOpen && isDirty && !isSaving) {
      setShowDiscardConfirm(true);
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const nextErrors = validatePurchaseBillForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      if (isEditMode) {
        await updateBill({ id: billId, payload: toUpdatePurchaseBillPayload(values) });
        showToast('Purchase bill updated', 'success');
      } else {
        await createBill(toCreatePurchaseBillPayload(values));
        showToast('Purchase bill created', 'success');
      }

      onOpenChange(false);
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    }
  };

  const drawerTitle = isEditMode ? 'Edit Purchase Bill' : 'Create Purchase Bill';
  const submitLabel = isEditMode ? 'Save Changes' : 'Create Bill';
  const isFormDisabled = isSaving || (isEditMode && isLoadingBill);
  const vendorsErrorMessage = vendorsError ? extractApiErrorMessage(vendorsError) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleCloseRequest}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {isEditMode && isLoadingBill ? (
            <LoadingState label="Loading purchase bill..." />
          ) : isEditMode && loadError ? (
            <ErrorState
              message={extractApiErrorMessage(loadError)}
              action={
                <Button variant="outline" onClick={() => void refetchBill()}>
                  Try again
                </Button>
              }
            />
          ) : (
            <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-6 pb-6">
                <SectionTitle>{drawerTitle}</SectionTitle>

                {errors.form ? <p className="text-sm text-danger">{errors.form}</p> : null}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="purchase-bill-vendor" className="text-sm font-medium">
                      Vendor
                    </label>
                    {isLoadingVendors ? (
                      <LoadingState label="Loading vendors..." />
                    ) : vendorsErrorMessage ? (
                      <ErrorState
                        message={vendorsErrorMessage}
                        action={
                          <Button variant="outline" size="sm" onClick={() => void refetchVendors()}>
                            Retry
                          </Button>
                        }
                      />
                    ) : (
                      <NativeSelect
                        id="purchase-bill-vendor"
                        value={values.vendorId}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('vendorId', event.target.value);
                        }}
                      >
                        <option value="">Select vendor</option>
                        {(vendorsData?.items ?? []).map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                    {errors.vendorId ? (
                      <p className="text-sm text-danger">{errors.vendorId}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="purchase-bill-number" className="text-sm font-medium">
                      Bill number
                    </label>
                    <Input
                      id="purchase-bill-number"
                      value={values.billNumber}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('billNumber', event.target.value);
                      }}
                    />
                    {errors.billNumber ? (
                      <p className="text-sm text-danger">{errors.billNumber}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="purchase-bill-issue-date" className="text-sm font-medium">
                        Issue Date
                      </label>
                      <Input
                        id="purchase-bill-issue-date"
                        type="date"
                        value={values.issueDate}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('issueDate', event.target.value);
                        }}
                      />
                      {errors.issueDate ? (
                        <p className="text-sm text-danger">{errors.issueDate}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="purchase-bill-due-date" className="text-sm font-medium">
                        Due Date
                      </label>
                      <Input
                        id="purchase-bill-due-date"
                        type="date"
                        value={values.dueDate}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('dueDate', event.target.value);
                        }}
                      />
                      {errors.dueDate ? (
                        <p className="text-sm text-danger">{errors.dueDate}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="purchase-bill-currency" className="text-sm font-medium">
                        Currency
                      </label>
                      <Input
                        id="purchase-bill-currency"
                        value={values.currency}
                        maxLength={3}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('currency', event.target.value.toUpperCase());
                        }}
                      />
                      {errors.currency ? (
                        <p className="text-sm text-danger">{errors.currency}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="purchase-bill-status" className="text-sm font-medium">
                        Status
                      </label>
                      <NativeSelect
                        id="purchase-bill-status"
                        value={values.status}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('status', event.target.value as PurchaseBillStatus);
                        }}
                      >
                        {(Object.keys(PURCHASE_BILL_STATUS_LABELS) as PurchaseBillStatus[]).map(
                          (status) => (
                            <option key={status} value={status}>
                              {PURCHASE_BILL_STATUS_LABELS[status]}
                            </option>
                          ),
                        )}
                      </NativeSelect>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="purchase-bill-notes" className="text-sm font-medium">
                      Notes
                    </label>
                    <Input
                      id="purchase-bill-notes"
                      value={values.notes}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('notes', event.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => {
                    handleCloseRequest(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isFormDisabled || (isEditMode && !isDirty)}
                  className="gap-2"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                  {submitLabel}
                </Button>
              </div>
            </form>
          )}
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
