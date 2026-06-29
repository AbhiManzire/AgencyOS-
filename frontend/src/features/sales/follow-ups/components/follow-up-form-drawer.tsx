'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import {
  areFollowUpFormValuesEqual,
  DEFAULT_FOLLOW_UP_FORM_VALUES,
  FOLLOW_UP_STATUS_LABELS,
  FOLLOW_UP_TYPE_LABELS,
  followUpToFormValues,
  validateFollowUpForm,
} from '@/features/sales/follow-ups/forms/follow-up-form.validation';
import type {
  FollowUpFormErrors,
  FollowUpFormValues,
  FollowUpListItem,
  FollowUpStatus,
  FollowUpType,
} from '@/features/sales/follow-ups/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export type FollowUpDrawerMode = 'create' | 'edit';

interface FollowUpFormDrawerProps {
  readonly open: boolean;
  readonly mode: FollowUpDrawerMode;
  readonly followUp?: FollowUpListItem;
  readonly isPending?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (values: FollowUpFormValues) => Promise<void>;
}

export function FollowUpFormDrawer({
  open,
  mode,
  followUp,
  isPending = false,
  onOpenChange,
  onSave,
}: FollowUpFormDrawerProps) {
  const { showToast } = useToast();
  const [values, setValues] = useState<FollowUpFormValues>(DEFAULT_FOLLOW_UP_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<FollowUpFormValues>(
    DEFAULT_FOLLOW_UP_FORM_VALUES,
  );
  const [errors, setErrors] = useState<FollowUpFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSaving = isPending || isSubmitting;
  const isEditMode = mode === 'edit';
  const isDirty = useMemo(
    () => !areFollowUpFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode && followUp !== undefined) {
      const formValues = followUpToFormValues(followUp);
      setValues(formValues);
      setInitialValues(formValues);
    } else {
      setValues(DEFAULT_FOLLOW_UP_FORM_VALUES);
      setInitialValues(DEFAULT_FOLLOW_UP_FORM_VALUES);
    }

    setErrors({});
  }, [followUp, isEditMode, open]);

  const updateField = <K extends keyof FollowUpFormValues>(
    field: K,
    value: FollowUpFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const errorKey = field as keyof FollowUpFormErrors;
      if (current[errorKey] === undefined) {
        return current;
      }
      const { [errorKey]: _removed, ...rest } = current;
      return rest;
    });
  };

  const closeDrawer = (): void => {
    setShowDiscardConfirm(false);
    onOpenChange(false);
  };

  const requestClose = (): void => {
    if (isDirty && !isSaving) {
      setShowDiscardConfirm(true);
      return;
    }

    closeDrawer();
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const nextErrors = validateFollowUpForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(values);
      showToast(isEditMode ? 'Follow-up updated' : 'Follow-up created', 'success');
      closeDrawer();
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
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
            requestClose();
            return;
          }

          onOpenChange(true);
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <header className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              {isEditMode ? 'Edit Follow-up' : 'Schedule Follow-up'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditMode
                ? 'Update follow-up details for this deal.'
                : 'Plan a call, meeting, or outreach for this deal.'}
            </p>
          </header>

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

                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-sm font-medium text-foreground">
                    Subject <span className="text-danger">*</span>
                  </label>
                  <Input
                    id="subject"
                    value={values.subject}
                    disabled={isSaving}
                    onChange={(event) => {
                      updateField('subject', event.target.value);
                    }}
                    placeholder="Discovery call"
                  />
                  {errors.subject ? <p className="text-xs text-danger">{errors.subject}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="type" className="text-sm font-medium text-foreground">
                    Type
                  </label>
                  <NativeSelect
                    id="type"
                    label="Type"
                    value={values.type}
                    disabled={isSaving}
                    onChange={(event) => {
                      updateField('type', event.target.value as FollowUpType);
                    }}
                  >
                    {(Object.keys(FOLLOW_UP_TYPE_LABELS) as FollowUpType[]).map((type) => (
                      <option key={type} value={type}>
                        {FOLLOW_UP_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </NativeSelect>
                  {errors.type ? <p className="text-xs text-danger">{errors.type}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="scheduledAt" className="text-sm font-medium text-foreground">
                    Date &amp; Time <span className="text-danger">*</span>
                  </label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={values.scheduledAt}
                    disabled={isSaving}
                    onChange={(event) => {
                      updateField('scheduledAt', event.target.value);
                    }}
                  />
                  {errors.scheduledAt ? (
                    <p className="text-xs text-danger">{errors.scheduledAt}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="notes" className="text-sm font-medium text-foreground">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={values.notes}
                    disabled={isSaving}
                    rows={4}
                    onChange={(event) => {
                      updateField('notes', event.target.value);
                    }}
                    placeholder="Agenda, talking points, or context"
                    className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reminderAt" className="text-sm font-medium text-foreground">
                    Reminder
                  </label>
                  <Input
                    id="reminderAt"
                    type="datetime-local"
                    value={values.reminderAt}
                    disabled={isSaving}
                    onChange={(event) => {
                      updateField('reminderAt', event.target.value);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="status" className="text-sm font-medium text-foreground">
                    Status
                  </label>
                  <NativeSelect
                    id="status"
                    label="Status"
                    value={values.status}
                    disabled={isSaving}
                    onChange={(event) => {
                      updateField('status', event.target.value as FollowUpStatus);
                    }}
                  >
                    {(Object.keys(FOLLOW_UP_STATUS_LABELS) as FollowUpStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {FOLLOW_UP_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </section>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" disabled={isSaving} onClick={requestClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {isEditMode ? 'Save Changes' : 'Create Follow-up'}
              </Button>
            </footer>
          </form>

          <UnsavedChangesDialog
            open={showDiscardConfirm}
            onCancel={() => {
              setShowDiscardConfirm(false);
            }}
            onConfirm={closeDrawer}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
