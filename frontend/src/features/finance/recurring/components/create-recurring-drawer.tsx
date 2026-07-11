'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import type { RecurringKind } from '@/features/finance/recurring/api/recurring.types';
import {
  areRecurringFormValuesEqual,
  DEFAULT_RECURRING_FORM_VALUES,
  RECURRING_FREQUENCY_LABELS,
  RECURRING_FREQUENCY_OPTIONS,
  toCreateRecurringPayload,
  validateRecurringForm,
} from '@/features/finance/recurring/forms/recurring-form.validation';
import { useCreateRecurringExpense } from '@/features/finance/recurring/hooks/use-create-recurring-expense';
import { useCreateRecurringInvoice } from '@/features/finance/recurring/hooks/use-create-recurring-invoice';
import type { RecurringFormErrors, RecurringFormValues } from '@/features/finance/recurring/types';
import type { RecurringFrequency } from '@/features/finance/shared/finance.types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface CreateRecurringDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly kind: RecurringKind;
}

export function CreateRecurringDrawer({ open, onOpenChange, kind }: CreateRecurringDrawerProps) {
  const { showToast } = useToast();
  const { mutateAsync: createInvoice, isPending: isCreatingInvoice } = useCreateRecurringInvoice();
  const { mutateAsync: createExpense, isPending: isCreatingExpense } = useCreateRecurringExpense();

  const [values, setValues] = useState<RecurringFormValues>(DEFAULT_RECURRING_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<RecurringFormValues>(
    DEFAULT_RECURRING_FORM_VALUES,
  );
  const [errors, setErrors] = useState<RecurringFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const isCreating = kind === 'invoice' ? isCreatingInvoice : isCreatingExpense;
  const title = kind === 'invoice' ? 'Create recurring invoice' : 'Create recurring expense';
  const successMessage =
    kind === 'invoice' ? 'Recurring invoice created' : 'Recurring expense created';

  const isDirty = useMemo(
    () => !areRecurringFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    setValues(DEFAULT_RECURRING_FORM_VALUES);
    setInitialValues(DEFAULT_RECURRING_FORM_VALUES);
    setErrors({});
  }, [open, kind]);

  const updateField = <K extends keyof RecurringFormValues>(
    field: K,
    value: RecurringFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const handleCloseRequest = (nextOpen: boolean): void => {
    if (!nextOpen && isDirty && !isCreating) {
      setShowDiscardConfirm(true);
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const nextErrors = validateRecurringForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      const payload = toCreateRecurringPayload(values);
      if (kind === 'invoice') {
        await createInvoice(payload);
      } else {
        await createExpense(payload);
      }
      showToast(successMessage, 'success');
      onOpenChange(false);
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleCloseRequest}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-6 pb-6">
              <SectionTitle>{title}</SectionTitle>

              {errors.form ? <p className="text-sm text-danger">{errors.form}</p> : null}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="recurring-frequency" className="text-sm font-medium">
                    Frequency
                  </label>
                  <NativeSelect
                    id="recurring-frequency"
                    label="Frequency"
                    value={values.frequency}
                    disabled={isCreating}
                    onChange={(event) => {
                      updateField('frequency', event.target.value as RecurringFrequency);
                    }}
                  >
                    {RECURRING_FREQUENCY_OPTIONS.map((frequency) => (
                      <option key={frequency} value={frequency}>
                        {RECURRING_FREQUENCY_LABELS[frequency]}
                      </option>
                    ))}
                  </NativeSelect>
                  {errors.frequency ? (
                    <p className="text-sm text-danger">{errors.frequency}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="recurring-next-run" className="text-sm font-medium">
                    Next run
                  </label>
                  <Input
                    id="recurring-next-run"
                    type="datetime-local"
                    value={values.nextRunAt}
                    disabled={isCreating}
                    onChange={(event) => {
                      updateField('nextRunAt', event.target.value);
                    }}
                  />
                  {errors.nextRunAt ? (
                    <p className="text-sm text-danger">{errors.nextRunAt}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="recurring-active"
                    checked={values.isActive}
                    disabled={isCreating}
                    onCheckedChange={(checked) => {
                      updateField('isActive', checked === true);
                    }}
                  />
                  <label htmlFor="recurring-active" className="text-sm font-medium">
                    Active
                  </label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="recurring-reminder" className="text-sm font-medium">
                    Reminder days before
                  </label>
                  <Input
                    id="recurring-reminder"
                    type="number"
                    min={0}
                    step={1}
                    value={values.reminderDaysBefore}
                    disabled={isCreating}
                    placeholder="Optional"
                    onChange={(event) => {
                      updateField('reminderDaysBefore', event.target.value);
                    }}
                  />
                  {errors.reminderDaysBefore ? (
                    <p className="text-sm text-danger">{errors.reminderDaysBefore}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="recurring-template" className="text-sm font-medium">
                    Template (JSON object)
                  </label>
                  <textarea
                    id="recurring-template"
                    value={values.templateJson}
                    disabled={isCreating}
                    rows={8}
                    spellCheck={false}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(event) => {
                      updateField('templateJson', event.target.value);
                    }}
                  />
                  {errors.templateJson ? (
                    <p className="text-sm text-danger">{errors.templateJson}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Must be a valid JSON object (e.g. clientId, category keys).
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={isCreating}
                onClick={() => {
                  handleCloseRequest(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="gap-2">
                {isCreating ? <Loader2 className="size-4 animate-spin" /> : null}
                Create
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
