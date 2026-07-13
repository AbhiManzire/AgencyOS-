'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import { useWorkspaceOwners } from '@/features/clients/hooks/use-workspace-owners';
import type {
  CreateSalesTaskPayload,
  SalesTaskPriority,
  SalesTaskRecord,
  SalesTaskType,
  UpdateSalesTaskPayload,
} from '@/features/sales/workspace/api/sales-task.types';
import {
  useCreateSalesTask,
  useSalesTask,
  useUpdateSalesTask,
} from '@/features/sales/workspace/hooks/use-sales-tasks';
import {
  SALES_TASK_PRIORITIES,
  SALES_TASK_PRIORITY_LABELS,
  SALES_TASK_TYPE_LABELS,
  SALES_TASK_TYPES,
  todayDateInputValue,
} from '@/features/sales/workspace/utils/workspace-labels';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { cn } from '@/lib/utils';

export type SalesTaskDrawerMode = 'create' | 'edit';

interface SalesTaskFormValues {
  readonly type: SalesTaskType;
  readonly title: string;
  readonly description: string;
  readonly ownerUserId: string;
  readonly dueDate: string;
  readonly dueTime: string;
  readonly priority: SalesTaskPriority;
}

interface SalesTaskFormErrors {
  type?: string;
  title?: string;
  ownerUserId?: string;
  dueDate?: string;
  form?: string;
}

const DEFAULT_VALUES: SalesTaskFormValues = {
  type: 'CALL',
  title: '',
  description: '',
  ownerUserId: '',
  dueDate: todayDateInputValue(),
  dueTime: '',
  priority: 'MEDIUM',
};

interface SalesTaskFormDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode?: SalesTaskDrawerMode;
  readonly taskId?: string;
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
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function fieldClassName(error?: string): string | undefined {
  return error ? 'border-danger focus-visible:ring-danger' : undefined;
}

function taskToFormValues(task: SalesTaskRecord): SalesTaskFormValues {
  return {
    type: task.type,
    title: task.title,
    description: task.description ?? '',
    ownerUserId: task.ownerUserId,
    dueDate: task.dueDate.slice(0, 10),
    dueTime: task.dueTime ?? '',
    priority: task.priority,
  };
}

function areFormValuesEqual(left: SalesTaskFormValues, right: SalesTaskFormValues): boolean {
  return (
    left.type === right.type &&
    left.title === right.title &&
    left.description === right.description &&
    left.ownerUserId === right.ownerUserId &&
    left.dueDate === right.dueDate &&
    left.dueTime === right.dueTime &&
    left.priority === right.priority
  );
}

function validateForm(values: SalesTaskFormValues): SalesTaskFormErrors {
  const errors: SalesTaskFormErrors = {};

  if (values.title.trim().length === 0) {
    errors.title = 'Title is required';
  }

  if (values.ownerUserId.trim().length === 0) {
    errors.ownerUserId = 'Owner is required';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) {
    errors.dueDate = 'Due date is required';
  }

  return errors;
}

function toCreatePayload(values: SalesTaskFormValues): CreateSalesTaskPayload {
  return {
    type: values.type,
    title: values.title.trim(),
    description: values.description.trim().length > 0 ? values.description.trim() : undefined,
    ownerUserId: values.ownerUserId,
    dueDate: values.dueDate,
    dueTime: values.dueTime.trim().length > 0 ? values.dueTime.trim() : null,
    priority: values.priority,
  };
}

function toUpdatePayload(values: SalesTaskFormValues): UpdateSalesTaskPayload {
  return {
    type: values.type,
    title: values.title.trim(),
    description: values.description.trim().length > 0 ? values.description.trim() : null,
    ownerUserId: values.ownerUserId,
    dueDate: values.dueDate,
    dueTime: values.dueTime.trim().length > 0 ? values.dueTime.trim() : null,
    priority: values.priority,
  };
}

/** Create/edit drawer for sales workspace tasks. */
export function SalesTaskFormDrawer({
  open,
  onOpenChange,
  mode = 'create',
  taskId,
}: SalesTaskFormDrawerProps) {
  const isEditMode = mode === 'edit' && taskId !== undefined && taskId.length > 0;
  const { showToast } = useToast();
  const { mutateAsync: createTask, isPending: isCreating } = useCreateSalesTask();
  const { mutateAsync: updateTask, isPending: isUpdating } = useUpdateSalesTask();
  const { data: owners = [] } = useWorkspaceOwners({ enabled: open });
  const {
    data: task,
    isLoading: isLoadingTask,
    error: loadError,
    refetch: refetchTask,
  } = useSalesTask(taskId ?? '', { enabled: open && isEditMode });

  const [values, setValues] = useState<SalesTaskFormValues>(DEFAULT_VALUES);
  const [initialValues, setInitialValues] = useState<SalesTaskFormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<SalesTaskFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode) {
      return;
    }

    setValues({
      ...DEFAULT_VALUES,
      dueDate: todayDateInputValue(),
      ownerUserId: '',
    });
    setInitialValues({
      ...DEFAULT_VALUES,
      dueDate: todayDateInputValue(),
      ownerUserId: '',
    });
    setErrors({});
  }, [isEditMode, open]);

  useEffect(() => {
    if (!open || isEditMode || owners.length === 0) {
      return;
    }

    setValues((current) => {
      if (current.ownerUserId.trim().length > 0) {
        return current;
      }
      return { ...current, ownerUserId: owners[0]?.id ?? '' };
    });
    setInitialValues((current) => {
      if (current.ownerUserId.trim().length > 0) {
        return current;
      }
      return { ...current, ownerUserId: owners[0]?.id ?? '' };
    });
  }, [isEditMode, open, owners]);

  useEffect(() => {
    if (!open || !isEditMode || task === undefined) {
      return;
    }

    const formValues = taskToFormValues(task);
    setValues(formValues);
    setInitialValues(formValues);
    setErrors({});
  }, [isEditMode, open, task]);

  const isDirty = useMemo(
    () => !areFormValuesEqual(values, initialValues),
    [initialValues, values],
  );
  const isSaving = isCreating || isUpdating;
  const isFormDisabled = isSaving || (isEditMode && isLoadingTask);

  const updateField = <K extends keyof SalesTaskFormValues>(
    field: K,
    value: SalesTaskFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const errorKey = field as keyof SalesTaskFormErrors;
      if (current[errorKey] === undefined && current.form === undefined) {
        return current;
      }
      const { [errorKey]: _removed, form: _form, ...rest } = current;
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

    const nextErrors = validateForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      if (isEditMode) {
        await updateTask({ id: taskId, payload: toUpdatePayload(values) });
        showToast('Task updated');
      } else {
        await createTask(toCreatePayload(values));
        showToast('Task created');
      }
      closeDrawer();
    } catch (saveError) {
      setErrors({ form: extractApiErrorMessage(saveError) });
      showToast(extractApiErrorMessage(saveError), 'error');
    }
  };

  return (
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
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <div className="relative flex h-full flex-col">
          <div className="border-b border-border px-6 py-4">
            <SectionTitle>{isEditMode ? 'Edit task' : 'New task'}</SectionTitle>
          </div>

          {isEditMode && isLoadingTask ? (
            <div className="flex-1 p-6">
              <LoadingState label="Loading task..." />
            </div>
          ) : isEditMode && loadError !== null ? (
            <div className="flex-1 p-6">
              <ErrorState
                message={extractApiErrorMessage(loadError)}
                action={
                  <Button variant="outline" onClick={() => void refetchTask()}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : (
            <form className="flex flex-1 flex-col" onSubmit={(event) => void handleSubmit(event)}>
              <div className="flex-1 space-y-4 px-6 py-4">
                <FormField label="Type" htmlFor="sales-task-type" required error={errors.type}>
                  <NativeSelect
                    id="sales-task-type"
                    value={values.type}
                    disabled={isFormDisabled}
                    className={cn(fieldClassName(errors.type))}
                    onChange={(event) => {
                      updateField('type', event.target.value as SalesTaskType);
                    }}
                  >
                    {SALES_TASK_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {SALES_TASK_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>

                <FormField label="Title" htmlFor="sales-task-title" required error={errors.title}>
                  <Input
                    id="sales-task-title"
                    value={values.title}
                    disabled={isFormDisabled}
                    className={cn(fieldClassName(errors.title))}
                    onChange={(event) => {
                      updateField('title', event.target.value);
                    }}
                  />
                </FormField>

                <FormField label="Description" htmlFor="sales-task-description">
                  <textarea
                    id="sales-task-description"
                    rows={4}
                    value={values.description}
                    disabled={isFormDisabled}
                    className="flex min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(event) => {
                      updateField('description', event.target.value);
                    }}
                  />
                </FormField>

                <FormField
                  label="Owner"
                  htmlFor="sales-task-owner"
                  required
                  error={errors.ownerUserId}
                >
                  <NativeSelect
                    id="sales-task-owner"
                    value={values.ownerUserId}
                    disabled={isFormDisabled || owners.length === 0}
                    className={cn(fieldClassName(errors.ownerUserId))}
                    onChange={(event) => {
                      updateField('ownerUserId', event.target.value);
                    }}
                  >
                    <option value="" disabled>
                      Select owner
                    </option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.displayName}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Due date"
                    htmlFor="sales-task-due-date"
                    required
                    error={errors.dueDate}
                  >
                    <Input
                      id="sales-task-due-date"
                      type="date"
                      value={values.dueDate}
                      disabled={isFormDisabled}
                      className={cn(fieldClassName(errors.dueDate))}
                      onChange={(event) => {
                        updateField('dueDate', event.target.value);
                      }}
                    />
                  </FormField>
                  <FormField label="Due time" htmlFor="sales-task-due-time">
                    <Input
                      id="sales-task-due-time"
                      type="time"
                      value={values.dueTime}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('dueTime', event.target.value);
                      }}
                    />
                  </FormField>
                </div>

                <FormField label="Priority" htmlFor="sales-task-priority">
                  <NativeSelect
                    id="sales-task-priority"
                    value={values.priority}
                    disabled={isFormDisabled}
                    onChange={(event) => {
                      updateField('priority', event.target.value as SalesTaskPriority);
                    }}
                  >
                    {SALES_TASK_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {SALES_TASK_PRIORITY_LABELS[priority]}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>

                {errors.form ? (
                  <p className="text-sm text-danger" role="alert">
                    {errors.form}
                  </p>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
                <Button type="button" variant="outline" disabled={isSaving} onClick={requestClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isFormDisabled} className="gap-2">
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isEditMode ? 'Save changes' : 'Create task'}
                </Button>
              </div>
            </form>
          )}

          <UnsavedChangesDialog
            open={showDiscardConfirm}
            onCancel={() => {
              setShowDiscardConfirm(false);
            }}
            onConfirm={closeDrawer}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
