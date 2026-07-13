'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import { ContactFormField } from '@/features/clients/contacts/components/contact-form-field';
import {
  areMilestoneFormValuesEqual,
  DEFAULT_MILESTONE_FORM_VALUES,
  milestoneToFormValues,
  toCreateMilestonePayload,
  toUpdateMilestonePayload,
  validateMilestoneForm,
} from '@/features/projects/milestones/forms/milestone-form.validation';
import type {
  MilestoneFormErrors,
  MilestoneFormValues,
  ProjectMilestoneListItem,
  ProjectMilestoneStatus,
  WorkspaceOwnerOption,
} from '@/features/projects/milestones/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export type MilestoneDrawerMode = 'create' | 'edit';

interface MilestoneFormDrawerProps {
  readonly open: boolean;
  readonly mode: MilestoneDrawerMode;
  readonly milestone?: ProjectMilestoneListItem;
  readonly availableOwners: readonly WorkspaceOwnerOption[];
  /** Other milestones available as dependency targets. */
  readonly availableMilestones?: readonly ProjectMilestoneListItem[];
  readonly isPending?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (values: MilestoneFormValues, mode: MilestoneDrawerMode) => Promise<void>;
}

export function MilestoneFormDrawer({
  open,
  mode,
  milestone,
  availableOwners,
  availableMilestones = [],
  isPending = false,
  onOpenChange,
  onSave,
}: MilestoneFormDrawerProps) {
  const { showToast } = useToast();
  const [values, setValues] = useState<MilestoneFormValues>(DEFAULT_MILESTONE_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<MilestoneFormValues>(
    DEFAULT_MILESTONE_FORM_VALUES,
  );
  const [errors, setErrors] = useState<MilestoneFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = mode === 'edit';
  const isSaving = isPending || isSubmitting;
  const isDirty = useMemo(
    () => !areMilestoneFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  const dependencyOptions = useMemo(
    () => availableMilestones.filter((item) => item.id !== milestone?.id),
    [availableMilestones, milestone],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode && milestone !== undefined) {
      const formValues = milestoneToFormValues(milestone);
      setValues(formValues);
      setInitialValues(formValues);
    } else {
      setValues(DEFAULT_MILESTONE_FORM_VALUES);
      setInitialValues(DEFAULT_MILESTONE_FORM_VALUES);
    }

    setErrors({});
  }, [isEditMode, milestone, open]);

  const updateField = <K extends keyof MilestoneFormValues>(
    field: K,
    value: MilestoneFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const errorKey = field as keyof MilestoneFormErrors;
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

  const handleOpenChange = (nextOpen: boolean): void => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    requestClose();
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const validationErrors = validateMilestoneForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(values, mode);
      showToast(isEditMode ? 'Milestone updated successfully' : 'Milestone added successfully');
      closeDrawer();
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const drawerTitle = isEditMode ? 'Edit Milestone' : 'Add Milestone';
  const submitLabel = isEditMode ? 'Save Changes' : 'Add Milestone';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="relative w-full max-w-md gap-0 p-0 sm:max-w-lg">
        <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
          <header className="border-b border-border px-6 py-4 pr-12">
            <SectionTitle>{drawerTitle}</SectionTitle>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            <ContactFormField label="Name" htmlFor="milestoneName" required error={errors.name}>
              <Input
                id="milestoneName"
                value={values.name}
                onChange={(event) => {
                  updateField('name', event.target.value);
                }}
                placeholder="Milestone name"
                disabled={isSaving}
              />
            </ContactFormField>

            <ContactFormField label="Description" htmlFor="milestoneDescription">
              <Input
                id="milestoneDescription"
                value={values.description}
                onChange={(event) => {
                  updateField('description', event.target.value);
                }}
                placeholder="Optional description"
                disabled={isSaving}
              />
            </ContactFormField>

            <ContactFormField label="Status" htmlFor="milestoneStatus">
              <NativeSelect
                id="milestoneStatus"
                label="Status"
                value={values.status}
                disabled={isSaving}
                onChange={(event) => {
                  updateField('status', event.target.value as ProjectMilestoneStatus);
                }}
              >
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
              </NativeSelect>
            </ContactFormField>

            <ContactFormField
              label="Start Date"
              htmlFor="milestoneStartDate"
              error={errors.startDate}
            >
              <Input
                id="milestoneStartDate"
                type="date"
                value={values.startDate}
                onChange={(event) => {
                  updateField('startDate', event.target.value);
                }}
                disabled={isSaving}
              />
            </ContactFormField>

            <ContactFormField label="Due Date" htmlFor="milestoneDueDate" error={errors.dueDate}>
              <Input
                id="milestoneDueDate"
                type="date"
                value={values.dueDate}
                onChange={(event) => {
                  updateField('dueDate', event.target.value);
                }}
                disabled={isSaving}
              />
            </ContactFormField>

            <ContactFormField label="Owner" htmlFor="milestoneOwner">
              <NativeSelect
                id="milestoneOwner"
                label="Owner"
                value={values.ownerUserId}
                disabled={isSaving || availableOwners.length === 0}
                onChange={(event) => {
                  updateField('ownerUserId', event.target.value);
                }}
              >
                <option value="">
                  {availableOwners.length === 0 ? 'No workspace users available' : 'Unassigned'}
                </option>
                {availableOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.displayName} ({owner.email})
                  </option>
                ))}
              </NativeSelect>
            </ContactFormField>

            <ContactFormField
              label="Completion %"
              htmlFor="completionPercent"
              error={errors.completionPercent}
            >
              <Input
                id="completionPercent"
                type="number"
                min={0}
                max={100}
                value={values.completionPercent}
                onChange={(event) => {
                  updateField('completionPercent', event.target.value);
                }}
                disabled={isSaving}
              />
            </ContactFormField>

            <ContactFormField label="Depends on" htmlFor="dependsOnMilestoneIds">
              <select
                id="dependsOnMilestoneIds"
                multiple
                value={values.dependsOnMilestoneIds}
                disabled={isSaving || dependencyOptions.length === 0}
                onChange={(event) => {
                  const selected = Array.from(event.target.selectedOptions).map(
                    (option) => option.value,
                  );
                  updateField('dependsOnMilestoneIds', selected);
                }}
                className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {dependencyOptions.length === 0 ? (
                  <option value="" disabled>
                    No other milestones
                  </option>
                ) : (
                  dependencyOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))
                )}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Hold Ctrl/Cmd to select multiple milestones.
              </p>
            </ContactFormField>

            {errors.form ? (
              <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger-foreground">
                {errors.form}
              </p>
            ) : null}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" disabled={isSaving} onClick={requestClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitLabel}
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
  );
}

export { toCreateMilestonePayload, toUpdateMilestonePayload };
