'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import { WorkflowActionsEditor } from '@/features/workflows/components/workflow-actions-editor';
import { WorkflowConditionsEditor } from '@/features/workflows/components/workflow-conditions-editor';
import type { WorkflowRecord } from '@/features/workflows/api/workflow.types';
import {
  areWorkflowFormValuesEqual,
  createDefaultWorkflowFormValues,
  toCreateWorkflowPayload,
  toUpdateWorkflowPayload,
  toggleTriggerSelection,
  validateWorkflowForm,
  workflowRecordToFormValues,
} from '@/features/workflows/forms/workflow-form.validation';
import { useCreateWorkflow } from '@/features/workflows/hooks/use-create-workflow';
import { useUpdateWorkflow } from '@/features/workflows/hooks/use-workflow-mutations';
import type {
  WorkflowConditionLogic,
  WorkflowFormErrors,
  WorkflowFormValues,
} from '@/features/workflows/types';
import { WORKFLOW_TRIGGER_OPTIONS } from '@/features/workflows/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface WorkflowBuilderDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly workflow?: WorkflowRecord | null;
}

/** Create / edit workflow builder with triggers, conditions, and actions. */
export function WorkflowBuilderDrawer({
  open,
  onOpenChange,
  workflow = null,
}: WorkflowBuilderDrawerProps) {
  const { showToast } = useToast();
  const { mutateAsync: createWorkflow, isPending: isCreating } = useCreateWorkflow();
  const { mutateAsync: updateWorkflow, isPending: isUpdating } = useUpdateWorkflow();

  const isEdit = workflow != null;
  const isSaving = isCreating || isUpdating;

  const [values, setValues] = useState<WorkflowFormValues>(createDefaultWorkflowFormValues);
  const [initialValues, setInitialValues] = useState<WorkflowFormValues>(
    createDefaultWorkflowFormValues,
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

    const nextValues = workflow
      ? workflowRecordToFormValues(workflow)
      : createDefaultWorkflowFormValues();
    setValues(nextValues);
    setInitialValues(nextValues);
    setErrors({});
  }, [open, workflow]);

  const updateField = <K extends keyof WorkflowFormValues>(
    field: K,
    value: WorkflowFormValues[K],
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

    const nextErrors = validateWorkflowForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      if (workflow != null) {
        await updateWorkflow({
          workflowId: workflow.id,
          payload: toUpdateWorkflowPayload(values),
        });
        showToast('Workflow updated', 'success');
      } else {
        await createWorkflow(toCreateWorkflowPayload(values));
        showToast('Workflow created', 'success');
      }
      onOpenChange(false);
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleCloseRequest}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-6 pb-6">
              <SectionTitle>{isEdit ? 'Edit Workflow' : 'Create Workflow'}</SectionTitle>

              {errors.form ? <p className="text-sm text-danger">{errors.form}</p> : null}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="workflow-name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="workflow-name"
                    value={values.name}
                    disabled={isSaving}
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
                    disabled={isSaving}
                    onChange={(event) => {
                      updateField('description', event.target.value);
                    }}
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2">
                  <Checkbox
                    checked={values.isEnabled}
                    disabled={isSaving}
                    onCheckedChange={(checked) => {
                      updateField('isEnabled', checked === true);
                    }}
                  />
                  <span className="text-sm">Enabled</span>
                </label>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Triggers</legend>
                  <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
                    {WORKFLOW_TRIGGER_OPTIONS.map((option) => {
                      const checked = values.triggers.includes(option.value);

                      return (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={isSaving}
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
                  <legend className="text-sm font-medium">Conditions</legend>
                  <WorkflowConditionsEditor
                    nodes={values.conditions}
                    rootLogic={values.rootLogic}
                    disabled={isSaving}
                    onRootLogicChange={(logic: WorkflowConditionLogic) => {
                      updateField('rootLogic', logic);
                    }}
                    onChange={(conditions) => {
                      updateField('conditions', conditions);
                    }}
                  />
                  {errors.conditions ? (
                    <p className="text-sm text-danger">{errors.conditions}</p>
                  ) : null}
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="sr-only">Actions</legend>
                  <WorkflowActionsEditor
                    actions={values.actions}
                    disabled={isSaving}
                    onChange={(actions) => {
                      updateField('actions', actions);
                    }}
                  />
                  {errors.actions ? <p className="text-sm text-danger">{errors.actions}</p> : null}
                </fieldset>
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
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? 'Save changes' : 'Create Workflow'}
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

/** @deprecated Prefer WorkflowBuilderDrawer */
export const CreateWorkflowDrawer = WorkflowBuilderDrawer;
