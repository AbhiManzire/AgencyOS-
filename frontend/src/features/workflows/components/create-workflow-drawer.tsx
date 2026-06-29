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
import {
  areWorkflowFormValuesEqual,
  DEFAULT_WORKFLOW_FORM_VALUES,
  toCreateWorkflowPayload,
  toggleActionSelection,
  toggleTriggerSelection,
  validateWorkflowForm,
} from '@/features/workflows/forms/workflow-form.validation';
import { useCreateWorkflow } from '@/features/workflows/hooks/use-create-workflow';
import type {
  WorkflowFormErrors,
  WorkflowFormValues,
  WorkflowStatus,
} from '@/features/workflows/types';
import {
  WORKFLOW_ACTION_OPTIONS,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_TRIGGER_OPTIONS,
} from '@/features/workflows/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface CreateWorkflowDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function CreateWorkflowDrawer({ open, onOpenChange }: CreateWorkflowDrawerProps) {
  const { showToast } = useToast();
  const { mutateAsync: createWorkflow, isPending: isCreating } = useCreateWorkflow();

  const [values, setValues] = useState<WorkflowFormValues>(DEFAULT_WORKFLOW_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<WorkflowFormValues>(
    DEFAULT_WORKFLOW_FORM_VALUES,
  );
  const [errors, setErrors] = useState<WorkflowFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const isDirty = useMemo(
    () => !areWorkflowFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(DEFAULT_WORKFLOW_FORM_VALUES);
    setInitialValues(DEFAULT_WORKFLOW_FORM_VALUES);
    setErrors({});
  }, [open]);

  const updateField = <K extends keyof WorkflowFormValues>(
    field: K,
    value: WorkflowFormValues[K],
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

    const nextErrors = validateWorkflowForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      await createWorkflow(toCreateWorkflowPayload(values));
      showToast('Workflow created', 'success');
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
              <SectionTitle>Create Workflow</SectionTitle>

              {errors.form ? <p className="text-sm text-danger">{errors.form}</p> : null}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="workflow-name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="workflow-name"
                    value={values.name}
                    disabled={isCreating}
                    onChange={(event) => {
                      updateField('name', event.target.value);
                    }}
                  />
                  {errors.name ? <p className="text-sm text-danger">{errors.name}</p> : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="workflow-description" className="text-sm font-medium">
                    Description
                  </label>
                  <Input
                    id="workflow-description"
                    value={values.description}
                    disabled={isCreating}
                    onChange={(event) => {
                      updateField('description', event.target.value);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="workflow-status" className="text-sm font-medium">
                    Status
                  </label>
                  <NativeSelect
                    id="workflow-status"
                    value={values.status}
                    disabled={isCreating}
                    onChange={(event) => {
                      updateField('status', event.target.value as WorkflowStatus);
                    }}
                  >
                    {(Object.keys(WORKFLOW_STATUS_LABELS) as WorkflowStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {WORKFLOW_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Triggers</legend>
                  <div className="space-y-2">
                    {WORKFLOW_TRIGGER_OPTIONS.map((option) => {
                      const checked = values.triggers.includes(option.value);

                      return (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={isCreating}
                            onCheckedChange={() => {
                              updateField(
                                'triggers',
                                toggleTriggerSelection(values.triggers, option.value),
                              );
                            }}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.triggers ? (
                    <p className="text-sm text-danger">{errors.triggers}</p>
                  ) : null}
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Actions</legend>
                  <div className="space-y-2">
                    {WORKFLOW_ACTION_OPTIONS.map((option) => {
                      const checked = values.actions.includes(option.value);

                      return (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={isCreating}
                            onCheckedChange={() => {
                              updateField(
                                'actions',
                                toggleActionSelection(values.actions, option.value),
                              );
                            }}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.actions ? <p className="text-sm text-danger">{errors.actions}</p> : null}
                </fieldset>
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
                Create Workflow
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
