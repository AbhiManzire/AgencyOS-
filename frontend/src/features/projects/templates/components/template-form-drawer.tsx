'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import { ContactFormField } from '@/features/clients/contacts/components/contact-form-field';
import type { ProjectTemplateRecord } from '@/features/projects/templates/api/template.types';
import {
  PROJECT_SERVICE_TYPE_LABELS,
  PROJECT_SERVICE_TYPES,
  type ProjectServiceType,
} from '@/features/projects/templates/api/template.types';
import {
  areTemplateFormValuesEqual,
  DEFAULT_TEMPLATE_FORM_VALUES,
  templateRecordToFormValues,
  toCreateTemplatePayload,
  toUpdateTemplatePayload,
  validateTemplateForm,
  type TemplateFormErrors,
  type TemplateFormValues,
} from '@/features/projects/templates/forms/template-form.validation';
import {
  useCreateProjectTemplate,
  useUpdateProjectTemplate,
} from '@/features/projects/templates/hooks/use-project-template-mutations';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { cn } from '@/lib/utils';

export type TemplateDrawerMode = 'create' | 'edit';

interface TemplateFormDrawerProps {
  readonly open: boolean;
  readonly mode: TemplateDrawerMode;
  readonly template?: ProjectTemplateRecord;
  readonly onOpenChange: (open: boolean) => void;
}

export function TemplateFormDrawer({
  open,
  mode,
  template,
  onOpenChange,
}: TemplateFormDrawerProps) {
  const { showToast } = useToast();
  const { mutateAsync: createTemplate, isPending: isCreating } = useCreateProjectTemplate();
  const { mutateAsync: updateTemplate, isPending: isUpdating } = useUpdateProjectTemplate();
  const [values, setValues] = useState<TemplateFormValues>(DEFAULT_TEMPLATE_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<TemplateFormValues>(
    DEFAULT_TEMPLATE_FORM_VALUES,
  );
  const [errors, setErrors] = useState<TemplateFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const isEditMode = mode === 'edit';
  const isPending = isCreating || isUpdating;
  const isDirty = useMemo(
    () => !areTemplateFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode && template !== undefined) {
      const formValues = templateRecordToFormValues(template);
      setValues(formValues);
      setInitialValues(formValues);
    } else {
      setValues(DEFAULT_TEMPLATE_FORM_VALUES);
      setInitialValues(DEFAULT_TEMPLATE_FORM_VALUES);
    }

    setErrors({});
  }, [isEditMode, open, template]);

  const updateField = <K extends keyof TemplateFormValues>(
    field: K,
    value: TemplateFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const errorKey = field as keyof TemplateFormErrors;
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
    if (isDirty && !isPending) {
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

    const validationErrors = validateTemplateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isEditMode && template !== undefined) {
        await updateTemplate({ id: template.id, payload: toUpdateTemplatePayload(values) });
        showToast('Template updated');
      } else {
        await createTemplate(toCreateTemplatePayload(values));
        showToast('Template created');
      }

      closeDrawer();
    } catch (submitError) {
      setErrors({ form: extractApiErrorMessage(submitError) });
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="relative w-full max-w-md gap-0 p-0 sm:max-w-lg">
        <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
          <header className="border-b border-border px-6 py-4 pr-12">
            <SectionTitle>{isEditMode ? 'Edit template' : 'Create template'}</SectionTitle>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <ContactFormField label="Name" htmlFor="templateName" required error={errors.name}>
              <Input
                id="templateName"
                value={values.name}
                onChange={(event) => {
                  updateField('name', event.target.value);
                }}
                disabled={isPending}
                placeholder="Website launch"
              />
            </ContactFormField>

            <ContactFormField label="Service type" htmlFor="serviceType">
              <NativeSelect
                id="serviceType"
                label="Service type"
                value={values.serviceType}
                disabled={isPending}
                onChange={(event) => {
                  updateField('serviceType', event.target.value as ProjectServiceType);
                }}
              >
                {PROJECT_SERVICE_TYPES.map((serviceType) => (
                  <option key={serviceType} value={serviceType}>
                    {PROJECT_SERVICE_TYPE_LABELS[serviceType]}
                  </option>
                ))}
              </NativeSelect>
            </ContactFormField>

            <ContactFormField
              label="Description"
              htmlFor="templateDescription"
              error={errors.description}
            >
              <textarea
                id="templateDescription"
                value={values.description}
                onChange={(event) => {
                  updateField('description', event.target.value);
                }}
                disabled={isPending}
                rows={3}
                className={cn(
                  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'ring-offset-background placeholder:text-muted-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              />
            </ContactFormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <ContactFormField
                label="Default duration (days)"
                htmlFor="defaultDurationDays"
                error={errors.defaultDurationDays}
              >
                <Input
                  id="defaultDurationDays"
                  type="number"
                  min={0}
                  value={values.defaultDurationDays}
                  onChange={(event) => {
                    updateField('defaultDurationDays', event.target.value);
                  }}
                  disabled={isPending}
                />
              </ContactFormField>

              <ContactFormField
                label="Default hours"
                htmlFor="defaultEstimatedHours"
                error={errors.defaultEstimatedHours}
              >
                <Input
                  id="defaultEstimatedHours"
                  type="number"
                  min={0}
                  step="0.01"
                  value={values.defaultEstimatedHours}
                  onChange={(event) => {
                    updateField('defaultEstimatedHours', event.target.value);
                  }}
                  disabled={isPending}
                />
              </ContactFormField>
            </div>

            <ContactFormField label="Active" htmlFor="isActive">
              <NativeSelect
                id="isActive"
                label="Active"
                value={values.isActive}
                disabled={isPending}
                onChange={(event) => {
                  updateField('isActive', event.target.value as 'yes' | 'no');
                }}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </NativeSelect>
            </ContactFormField>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <SectionTitle className="text-base">Milestones</SectionTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={isPending}
                  onClick={() => {
                    updateField('milestones', [
                      ...values.milestones,
                      { name: '', description: '', offsetDays: '0' },
                    ]);
                  }}
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>
              {values.milestones.map((milestone, index) => (
                <div
                  key={`ms-${String(index)}`}
                  className="space-y-2 rounded-md border border-border p-3"
                >
                  <div className="flex items-start gap-2">
                    <Input
                      value={milestone.name}
                      placeholder="Milestone name"
                      disabled={isPending}
                      onChange={(event) => {
                        const next = [...values.milestones];
                        next[index] = { ...milestone, name: event.target.value };
                        updateField('milestones', next);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      onClick={() => {
                        updateField(
                          'milestones',
                          values.milestones.filter((_, i) => i !== index),
                        );
                      }}
                      aria-label="Remove milestone"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={milestone.offsetDays}
                    placeholder="Offset days"
                    disabled={isPending}
                    onChange={(event) => {
                      const next = [...values.milestones];
                      next[index] = { ...milestone, offsetDays: event.target.value };
                      updateField('milestones', next);
                    }}
                  />
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <SectionTitle className="text-base">Tasks</SectionTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={isPending}
                  onClick={() => {
                    updateField('tasks', [
                      ...values.tasks,
                      { title: '', description: '', offsetDays: '0', estimatedHours: '' },
                    ]);
                  }}
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>
              {values.tasks.map((task, index) => (
                <div
                  key={`task-${String(index)}`}
                  className="space-y-2 rounded-md border border-border p-3"
                >
                  <div className="flex items-start gap-2">
                    <Input
                      value={task.title}
                      placeholder="Task title"
                      disabled={isPending}
                      onChange={(event) => {
                        const next = [...values.tasks];
                        next[index] = { ...task, title: event.target.value };
                        updateField('tasks', next);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      onClick={() => {
                        updateField(
                          'tasks',
                          values.tasks.filter((_, i) => i !== index),
                        );
                      }}
                      aria-label="Remove task"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={task.offsetDays}
                      placeholder="Offset days"
                      disabled={isPending}
                      onChange={(event) => {
                        const next = [...values.tasks];
                        next[index] = { ...task, offsetDays: event.target.value };
                        updateField('tasks', next);
                      }}
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={task.estimatedHours}
                      placeholder="Hours"
                      disabled={isPending}
                      onChange={(event) => {
                        const next = [...values.tasks];
                        next[index] = { ...task, estimatedHours: event.target.value };
                        updateField('tasks', next);
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>

            {errors.form ? (
              <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger-foreground">
                {errors.form}
              </p>
            ) : null}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" disabled={isPending} onClick={requestClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || (isEditMode && !isDirty)}
              className="gap-2"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEditMode ? 'Save changes' : 'Create template'}
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
