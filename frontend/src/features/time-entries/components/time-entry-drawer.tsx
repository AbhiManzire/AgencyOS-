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
import { ContactFormField } from '@/features/clients/contacts/components/contact-form-field';
import { useProjectMembers } from '@/features/projects/members/hooks/use-project-members';
import {
  areTimeEntryFormValuesEqual,
  DEFAULT_TIME_ENTRY_FORM_VALUES,
  timeEntryToFormValues,
  toCreateTimeEntryPayload,
  toUpdateTimeEntryPayload,
  validateTimeEntryForm,
} from '@/features/time-entries/forms/time-entry-form.validation';
import type {
  TimeEntryDrawerMode,
  TimeEntryFormErrors,
  TimeEntryFormValues,
  TimeEntryListItem,
} from '@/features/time-entries/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export { toCreateTimeEntryPayload, toUpdateTimeEntryPayload };

interface TimeEntryDrawerProps {
  readonly open: boolean;
  readonly mode: TimeEntryDrawerMode;
  readonly projectId: string;
  readonly entry?: TimeEntryListItem;
  readonly isPending?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (values: TimeEntryFormValues, mode: TimeEntryDrawerMode) => Promise<void>;
}

export function TimeEntryDrawer({
  open,
  mode,
  projectId,
  entry,
  isPending = false,
  onOpenChange,
  onSave,
}: TimeEntryDrawerProps) {
  const { showToast } = useToast();
  const { data: membersData } = useProjectMembers(projectId);
  const userOptions = membersData?.availableUsers ?? [];

  const [values, setValues] = useState<TimeEntryFormValues>(DEFAULT_TIME_ENTRY_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<TimeEntryFormValues>(
    DEFAULT_TIME_ENTRY_FORM_VALUES,
  );
  const [errors, setErrors] = useState<TimeEntryFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = mode === 'edit';
  const isSaving = isPending || isSubmitting;
  const isDirty = useMemo(
    () => !areTimeEntryFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    const nextValues =
      isEditMode && entry !== undefined
        ? timeEntryToFormValues(entry)
        : {
            ...DEFAULT_TIME_ENTRY_FORM_VALUES,
            userId: userOptions[0]?.id ?? '',
          };

    setValues(nextValues);
    setInitialValues(nextValues);
    setErrors({});
  }, [open, isEditMode, entry, userOptions]);

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

  const handleOpenChange = (nextOpen: boolean): void => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    requestClose();
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const nextErrors = validateTimeEntryForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(values, mode);
      showToast(isEditMode ? 'Time entry updated successfully' : 'Time entry added successfully');
      closeDrawer();
    } catch (saveError) {
      showToast(extractApiErrorMessage(saveError), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
            <div className="border-b border-border pb-4">
              <SectionTitle>{isEditMode ? 'Edit Time Entry' : 'Add Time Entry'}</SectionTitle>
            </div>

            <div className="flex-1 space-y-4 py-6">
              <ContactFormField label="User" htmlFor="time-entry-user" error={errors.userId}>
                <NativeSelect
                  id="time-entry-user"
                  value={values.userId}
                  disabled={isSaving}
                  onChange={(event) => {
                    setValues((current) => ({ ...current, userId: event.target.value }));
                  }}
                >
                  <option value="">Select user</option>
                  {userOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName}
                    </option>
                  ))}
                </NativeSelect>
              </ContactFormField>

              <ContactFormField
                label="Start Time"
                htmlFor="time-entry-start"
                error={errors.startTime}
              >
                <Input
                  id="time-entry-start"
                  type="datetime-local"
                  value={values.startTime}
                  disabled={isSaving}
                  onChange={(event) => {
                    setValues((current) => ({ ...current, startTime: event.target.value }));
                  }}
                />
              </ContactFormField>

              <ContactFormField label="End Time" htmlFor="time-entry-end" error={errors.endTime}>
                <Input
                  id="time-entry-end"
                  type="datetime-local"
                  value={values.endTime}
                  disabled={isSaving}
                  onChange={(event) => {
                    setValues((current) => ({ ...current, endTime: event.target.value }));
                  }}
                />
              </ContactFormField>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="time-entry-billable"
                  checked={values.billable}
                  disabled={isSaving}
                  onCheckedChange={(checked) => {
                    setValues((current) => ({ ...current, billable: checked === true }));
                  }}
                />
                <label htmlFor="time-entry-billable" className="text-sm font-medium">
                  Billable
                </label>
              </div>

              <ContactFormField label="Notes" htmlFor="time-entry-notes">
                <textarea
                  id="time-entry-notes"
                  rows={4}
                  value={values.notes}
                  disabled={isSaving}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Optional notes about this work"
                  onChange={(event) => {
                    setValues((current) => ({ ...current, notes: event.target.value }));
                  }}
                />
              </ContactFormField>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" disabled={isSaving} onClick={requestClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEditMode ? 'Save Changes' : 'Add Entry'}
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
          closeDrawer();
        }}
      />
    </>
  );
}
