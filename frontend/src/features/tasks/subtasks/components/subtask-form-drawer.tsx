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
import { useProjectMembers } from '@/features/projects/members/hooks/use-project-members';
import { PRIORITY_LABELS } from '@/features/tasks/components/task-priority-badge';
import {
  areSubtaskFormValuesEqual,
  DEFAULT_SUBTASK_FORM_VALUES,
  subtaskToFormValues,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  toCreateSubtaskPayload,
  toUpdateSubtaskPayload,
  validateSubtaskForm,
} from '@/features/tasks/subtasks/forms/subtask-form.validation';
import type {
  SubtaskDrawerMode,
  SubtaskFormErrors,
  SubtaskFormValues,
  SubtaskListItem,
} from '@/features/tasks/subtasks/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export { toCreateSubtaskPayload, toUpdateSubtaskPayload };

interface SubtaskFormDrawerProps {
  readonly open: boolean;
  readonly mode: SubtaskDrawerMode;
  readonly projectId: string;
  readonly subtask?: SubtaskListItem;
  readonly isPending?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (values: SubtaskFormValues, mode: SubtaskDrawerMode) => Promise<void>;
}

const STATUS_LABELS: Record<(typeof TASK_STATUS_OPTIONS)[number], string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

export function SubtaskFormDrawer({
  open,
  mode,
  projectId,
  subtask,
  isPending = false,
  onOpenChange,
  onSave,
}: SubtaskFormDrawerProps) {
  const { showToast } = useToast();
  const { data: membersData } = useProjectMembers(projectId);
  const assigneeOptions = membersData?.availableUsers ?? [];

  const [values, setValues] = useState<SubtaskFormValues>(DEFAULT_SUBTASK_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<SubtaskFormValues>(
    DEFAULT_SUBTASK_FORM_VALUES,
  );
  const [errors, setErrors] = useState<SubtaskFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = mode === 'edit';
  const isSaving = isPending || isSubmitting;
  const isDirty = useMemo(
    () => !areSubtaskFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode && subtask !== undefined) {
      const formValues = subtaskToFormValues(subtask);
      setValues(formValues);
      setInitialValues(formValues);
    } else {
      setValues(DEFAULT_SUBTASK_FORM_VALUES);
      setInitialValues(DEFAULT_SUBTASK_FORM_VALUES);
    }

    setErrors({});
  }, [isEditMode, open, subtask]);

  const updateField = <K extends keyof SubtaskFormValues>(
    field: K,
    value: SubtaskFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const errorKey = field as keyof SubtaskFormErrors;
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

    const validationErrors = validateSubtaskForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(values, mode);
      showToast(isEditMode ? 'Subtask updated successfully' : 'Subtask added successfully');
      closeDrawer();
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const drawerTitle = isEditMode ? 'Edit Subtask' : 'Add Subtask';
  const submitLabel = isEditMode ? 'Save Changes' : 'Add Subtask';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="relative w-full max-w-md gap-0 p-0 sm:max-w-lg">
        <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
          <header className="border-b border-border px-6 py-4 pr-12">
            <SectionTitle>{drawerTitle}</SectionTitle>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            <ContactFormField label="Title" htmlFor="subtaskTitle" required error={errors.title}>
              <Input
                id="subtaskTitle"
                value={values.title}
                onChange={(event) => {
                  updateField('title', event.target.value);
                }}
                placeholder="Subtask title"
                disabled={isSaving}
              />
            </ContactFormField>

            <ContactFormField label="Assignee" htmlFor="subtaskAssignee">
              <NativeSelect
                id="subtaskAssignee"
                label="Assignee"
                value={values.assigneeUserId}
                disabled={isSaving || assigneeOptions.length === 0}
                onChange={(event) => {
                  updateField('assigneeUserId', event.target.value);
                }}
              >
                <option value="">
                  {assigneeOptions.length === 0 ? 'No members available' : 'Unassigned'}
                </option>
                {assigneeOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName}
                  </option>
                ))}
              </NativeSelect>
            </ContactFormField>

            <ContactFormField label="Priority" htmlFor="subtaskPriority">
              <NativeSelect
                id="subtaskPriority"
                label="Priority"
                value={values.priority}
                disabled={isSaving}
                onChange={(event) => {
                  updateField('priority', event.target.value as SubtaskFormValues['priority']);
                }}
              >
                {TASK_PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </NativeSelect>
            </ContactFormField>

            <ContactFormField label="Status" htmlFor="subtaskStatus">
              <NativeSelect
                id="subtaskStatus"
                label="Status"
                value={values.status}
                disabled={isSaving}
                onChange={(event) => {
                  updateField('status', event.target.value as SubtaskFormValues['status']);
                }}
              >
                {TASK_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </NativeSelect>
            </ContactFormField>

            <ContactFormField label="Due Date" htmlFor="subtaskDueDate" error={errors.dueDate}>
              <Input
                id="subtaskDueDate"
                type="date"
                value={values.dueDate}
                disabled={isSaving}
                onChange={(event) => {
                  updateField('dueDate', event.target.value);
                }}
              />
            </ContactFormField>

            {errors.form !== undefined ? (
              <p className="text-sm text-danger" role="alert">
                {errors.form}
              </p>
            ) : null}
          </div>

          <footer className="border-t border-border px-6 py-4">
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={isSaving} onClick={requestClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {submitLabel}
              </Button>
            </div>
          </footer>
        </form>
      </SheetContent>

      <UnsavedChangesDialog
        open={showDiscardConfirm}
        onCancel={() => {
          setShowDiscardConfirm(false);
        }}
        onConfirm={closeDrawer}
      />
    </Sheet>
  );
}
