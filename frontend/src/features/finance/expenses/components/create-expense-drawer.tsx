'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import {
  areExpenseFormValuesEqual,
  DEFAULT_EXPENSE_FORM_VALUES,
  toCreateExpensePayload,
  toUpdateExpensePayload,
  validateExpenseForm,
  expenseRecordToFormValues,
  type ExpenseFormErrors,
  type ExpenseFormValues,
} from '@/features/finance/expenses/forms/expense-form.validation';
import { useCreateExpense } from '@/features/finance/expenses/hooks/use-create-expense';
import { useExpense } from '@/features/finance/expenses/hooks/use-expense';
import { useUpdateExpense } from '@/features/finance/expenses/hooks/use-update-expense';
import {
  APPROVAL_STATUS_LABELS,
  type ApprovalStatus,
} from '@/features/finance/shared/finance.types';
import { useVendors } from '@/features/finance/vendors/hooks/use-vendors';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export type ExpenseDrawerMode = 'create' | 'edit';

const APPROVAL_OPTIONS: readonly ApprovalStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'NOT_REQUIRED',
];

interface CreateExpenseDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode?: ExpenseDrawerMode;
  readonly expenseId?: string;
}

interface FormFieldProps {
  readonly label: string;
  readonly htmlFor: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly children: ReactNode;
}

function FormField({ label, htmlFor, required = false, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

export function CreateExpenseDrawer({
  open,
  onOpenChange,
  mode = 'create',
  expenseId,
}: CreateExpenseDrawerProps) {
  const isEditMode = mode === 'edit' && expenseId !== undefined && expenseId.length > 0;
  const { showToast } = useToast();
  const { mutateAsync: createExpense, isPending: isCreating } = useCreateExpense();
  const { mutateAsync: updateExpense, isPending: isUpdating } = useUpdateExpense();
  const {
    data: expense,
    isLoading: isLoadingExpense,
    error: loadError,
    refetch: refetchExpense,
  } = useExpense(expenseId ?? '', { enabled: open && isEditMode });
  const { data: vendorsData, isLoading: isLoadingVendors } = useVendors(
    { take: 100, sortBy: 'name', sortOrder: 'asc' },
    { enabled: open },
  );

  const vendorOptions = useMemo(() => vendorsData?.items ?? [], [vendorsData]);

  const [values, setValues] = useState<ExpenseFormValues>(DEFAULT_EXPENSE_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<ExpenseFormValues>(
    DEFAULT_EXPENSE_FORM_VALUES,
  );
  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode) {
      return;
    }

    setValues(DEFAULT_EXPENSE_FORM_VALUES);
    setInitialValues(DEFAULT_EXPENSE_FORM_VALUES);
    setErrors({});
  }, [isEditMode, open]);

  useEffect(() => {
    if (!open || !isEditMode || expense === undefined) {
      return;
    }

    const formValues = expenseRecordToFormValues(expense);
    setValues(formValues);
    setInitialValues(formValues);
    setErrors({});
  }, [isEditMode, expense, open]);

  const isDirty = !areExpenseFormValuesEqual(values, initialValues);
  const isSaving = isCreating || isUpdating;
  const isFormDisabled = isSaving || (isEditMode && isLoadingExpense);

  const updateField = <K extends keyof ExpenseFormValues>(
    field: K,
    value: ExpenseFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const handleCloseRequest = (nextOpen: boolean): void => {
    if (!nextOpen && isDirty && !isSaving) {
      setShowDiscardConfirm(true);
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const nextErrors = validateExpenseForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      if (isEditMode) {
        await updateExpense({ id: expenseId, payload: toUpdateExpensePayload(values) });
        showToast('Expense updated', 'success');
        onOpenChange(false);
      } else {
        await createExpense(toCreateExpensePayload(values));
        showToast('Expense created', 'success');
        onOpenChange(false);
      }
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleCloseRequest}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <header className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              {isEditMode ? 'Edit Expense' : 'Create Expense'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditMode
                ? 'Update expense details and amounts.'
                : 'Record a new expense for this workspace.'}
            </p>
          </header>

          {isEditMode && isLoadingExpense ? (
            <LoadingState label="Loading expense..." className="p-6" />
          ) : isEditMode && loadError ? (
            <div className="p-6">
              <ErrorState
                message={extractApiErrorMessage(loadError)}
                action={
                  <Button variant="outline" onClick={() => void refetchExpense()}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : (
            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                {errors.form ? (
                  <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                    {errors.form}
                  </p>
                ) : null}

                <section className="space-y-4">
                  <SectionTitle className="text-base">Details</SectionTitle>
                  <FormField
                    label="Category"
                    htmlFor="expense-category"
                    required
                    error={errors.category}
                  >
                    <Input
                      id="expense-category"
                      value={values.category}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('category', event.target.value);
                      }}
                      placeholder="e.g. Travel, Software, Office"
                    />
                  </FormField>
                  <FormField label="Vendor" htmlFor="expense-vendor">
                    <NativeSelect
                      id="expense-vendor"
                      value={values.vendorId}
                      disabled={isFormDisabled || isLoadingVendors}
                      onChange={(event) => {
                        updateField('vendorId', event.target.value);
                      }}
                    >
                      <option value="">No vendor</option>
                      {vendorOptions.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Amount"
                      htmlFor="expense-amount"
                      required
                      error={errors.amount}
                    >
                      <Input
                        id="expense-amount"
                        type="number"
                        min={0}
                        step="0.01"
                        value={values.amount}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('amount', event.target.value);
                        }}
                      />
                    </FormField>
                    <FormField label="Tax amount" htmlFor="expense-tax" error={errors.taxAmount}>
                      <Input
                        id="expense-tax"
                        type="number"
                        min={0}
                        step="0.01"
                        value={values.taxAmount}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('taxAmount', event.target.value);
                        }}
                      />
                    </FormField>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Currency" htmlFor="expense-currency" error={errors.currency}>
                      <Input
                        id="expense-currency"
                        value={values.currency}
                        disabled={isFormDisabled}
                        maxLength={3}
                        onChange={(event) => {
                          updateField('currency', event.target.value.toUpperCase());
                        }}
                      />
                    </FormField>
                    <FormField
                      label="Expense date"
                      htmlFor="expense-date"
                      required
                      error={errors.expenseDate}
                    >
                      <Input
                        id="expense-date"
                        type="date"
                        value={values.expenseDate}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('expenseDate', event.target.value);
                        }}
                      />
                    </FormField>
                  </div>
                  {!isEditMode ? (
                    <FormField label="Approval status" htmlFor="expense-approval">
                      <NativeSelect
                        id="expense-approval"
                        value={values.approvalStatus}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('approvalStatus', event.target.value as ApprovalStatus);
                        }}
                      >
                        {APPROVAL_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {APPROVAL_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormField>
                  ) : null}
                  <FormField label="Description" htmlFor="expense-description">
                    <textarea
                      id="expense-description"
                      rows={3}
                      value={values.description}
                      disabled={isFormDisabled}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(event) => {
                        updateField('description', event.target.value);
                      }}
                    />
                  </FormField>
                </section>
              </div>

              <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
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
                <Button type="submit" disabled={isFormDisabled} className="gap-2">
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isEditMode ? 'Save changes' : 'Create expense'}
                </Button>
              </footer>
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
