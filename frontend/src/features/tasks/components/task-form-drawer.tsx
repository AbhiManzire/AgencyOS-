'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import { ContactFormField } from '@/features/clients/contacts/components/contact-form-field';
import { mapProjectRecordToListItem } from '@/features/projects/api/project.mapper';
import { useProjectMembers } from '@/features/projects/members/hooks/use-project-members';
import { useProjectMilestones } from '@/features/projects/milestones/hooks/use-project-milestones';
import { useProjects } from '@/features/projects/hooks/use-projects';
import type { TaskRecord } from '@/features/tasks/api/task.types';
import {
  areTaskFormValuesEqual,
  DEFAULT_TASK_FORM_VALUES,
  taskRecordToFormValues,
  toCreateTaskPayload,
  toUpdateTaskPayload,
  validateTaskForm,
  type TaskFormErrors,
  type TaskFormValues,
} from '@/features/tasks/forms/task-form.validation';
import { useCreateTask } from '@/features/tasks/hooks/use-create-task';
import { useUpdateTask } from '@/features/tasks/hooks/use-update-task';
import type { TaskPriority, TaskStatus } from '@/features/tasks/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { cn } from '@/lib/utils';

export type TaskDrawerMode = 'create' | 'edit';

interface TaskFormDrawerProps {
  readonly open: boolean;
  readonly mode: TaskDrawerMode;
  readonly task?: TaskRecord;
  readonly isPending?: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function TaskFormDrawer({
  open,
  mode,
  task,
  isPending: isPendingProp = false,
  onOpenChange,
}: TaskFormDrawerProps) {
  const { showToast } = useToast();
  const { mutateAsync: createTask, isPending: isCreating } = useCreateTask();
  const { mutateAsync: updateTask, isPending: isUpdating } = useUpdateTask();

  const isEditMode = mode === 'edit';
  const isSaving = isPendingProp || isCreating || isUpdating;

  const [values, setValues] = useState<TaskFormValues>(DEFAULT_TASK_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<TaskFormValues>(DEFAULT_TASK_FORM_VALUES);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const selectedProjectId = isEditMode ? (task?.projectId ?? '') : values.projectId;

  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjects({ take: 100 }, { enabled: open });

  const {
    data: milestonesData,
    isLoading: isLoadingMilestones,
    error: milestonesError,
    refetch: refetchMilestones,
  } = useProjectMilestones(selectedProjectId);

  const {
    data: membersData,
    isLoading: isLoadingMembers,
    error: membersError,
    refetch: refetchMembers,
  } = useProjectMembers(selectedProjectId);

  const projectOptions = useMemo(() => {
    if (!projectsData) {
      return [];
    }

    return projectsData.items
      .filter((project) => project.deletedAt === null)
      .map((project) => ({
        id: project.id,
        label: mapProjectRecordToListItem(project).name,
      }))
      .sort((left, right) =>
        left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
      );
  }, [projectsData]);

  const projectLabel = useMemo(() => {
    if (!isEditMode || task === undefined) {
      return '';
    }

    return projectOptions.find((option) => option.id === task.projectId)?.label ?? task.projectId;
  }, [isEditMode, projectOptions, task]);

  const milestoneOptions = milestonesData?.milestones ?? [];
  const assigneeOptions = membersData?.availableUsers ?? [];

  const isDirty = useMemo(
    () => !areTaskFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode && task !== undefined) {
      const formValues = taskRecordToFormValues(task);
      setValues(formValues);
      setInitialValues(formValues);
    } else {
      setValues(DEFAULT_TASK_FORM_VALUES);
      setInitialValues(DEFAULT_TASK_FORM_VALUES);
    }

    setErrors({});
  }, [isEditMode, open, task]);

  const updateField = <K extends keyof TaskFormValues>(
    field: K,
    value: TaskFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const errorKey = field as keyof TaskFormErrors;
      if (current[errorKey] === undefined) {
        return current;
      }

      const { [errorKey]: _removed, ...rest } = current;
      return rest;
    });
  };

  const handleProjectChange = (projectId: string): void => {
    setValues((current) => ({
      ...current,
      projectId,
      milestoneId: '',
      assigneeUserId: '',
    }));
    setErrors((current) => {
      const { projectId: _removed, ...rest } = current;
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

    const validationErrors = validateTaskForm(values, isEditMode);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isEditMode && task !== undefined) {
        await updateTask({ taskId: task.id, payload: toUpdateTaskPayload(values) });
        showToast('Task updated successfully');
      } else {
        await createTask(toCreateTaskPayload(values));
        showToast('Task created successfully');
      }

      closeDrawer();
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    }
  };

  const drawerTitle = isEditMode ? 'Edit Task' : 'Create Task';
  const submitLabel = isEditMode ? 'Save Changes' : 'Create Task';
  const hasProjectSelected = selectedProjectId.length > 0;
  const isLoadingDependencies =
    isLoadingProjects || (hasProjectSelected && (isLoadingMilestones || isLoadingMembers));

  const renderDependencyError = (): ReactNode => {
    if (projectsError) {
      return (
        <ErrorState
          message={extractApiErrorMessage(projectsError)}
          action={
            <Button variant="outline" onClick={() => void refetchProjects()}>
              Try again
            </Button>
          }
        />
      );
    }

    if (hasProjectSelected && milestonesError) {
      return (
        <ErrorState
          message={extractApiErrorMessage(milestonesError)}
          action={
            <Button variant="outline" onClick={() => void refetchMilestones()}>
              Try again
            </Button>
          }
        />
      );
    }

    if (hasProjectSelected && membersError) {
      return (
        <ErrorState
          message={extractApiErrorMessage(membersError)}
          action={
            <Button variant="outline" onClick={() => void refetchMembers()}>
              Try again
            </Button>
          }
        />
      );
    }

    return null;
  };

  const dependencyError = renderDependencyError();

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="relative w-full max-w-md gap-0 p-0 sm:max-w-lg">
        <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
          <header className="border-b border-border px-6 py-4 pr-12">
            <SectionTitle>{drawerTitle}</SectionTitle>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {isLoadingDependencies ? (
              <LoadingState label="Loading form options..." />
            ) : dependencyError !== null ? (
              dependencyError
            ) : (
              <>
                <ContactFormField label="Title" htmlFor="taskTitle" required error={errors.title}>
                  <Input
                    id="taskTitle"
                    value={values.title}
                    onChange={(event) => {
                      updateField('title', event.target.value);
                    }}
                    placeholder="Task title"
                    disabled={isSaving}
                  />
                </ContactFormField>

                {isEditMode ? (
                  <ContactFormField label="Project" htmlFor="taskProject" required>
                    <Input id="taskProject" value={projectLabel} disabled />
                  </ContactFormField>
                ) : (
                  <ContactFormField
                    label="Project"
                    htmlFor="taskProjectId"
                    required
                    error={errors.projectId}
                  >
                    <NativeSelect
                      id="taskProjectId"
                      label="Project"
                      value={values.projectId}
                      disabled={isSaving || projectOptions.length === 0}
                      onChange={(event) => {
                        handleProjectChange(event.target.value);
                      }}
                    >
                      <option value="">
                        {projectOptions.length === 0 ? 'No projects available' : 'Select a project'}
                      </option>
                      {projectOptions.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </ContactFormField>
                )}

                <ContactFormField label="Milestone" htmlFor="taskMilestoneId">
                  <NativeSelect
                    id="taskMilestoneId"
                    label="Milestone"
                    value={values.milestoneId}
                    disabled={isSaving || !hasProjectSelected || milestoneOptions.length === 0}
                    onChange={(event) => {
                      updateField('milestoneId', event.target.value);
                    }}
                  >
                    <option value="">
                      {!hasProjectSelected
                        ? 'Select a project first'
                        : milestoneOptions.length === 0
                          ? 'No milestones available'
                          : 'No milestone'}
                    </option>
                    {milestoneOptions.map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.name}
                      </option>
                    ))}
                  </NativeSelect>
                </ContactFormField>

                <ContactFormField label="Assignee" htmlFor="taskAssigneeUserId">
                  <NativeSelect
                    id="taskAssigneeUserId"
                    label="Assignee"
                    value={values.assigneeUserId}
                    disabled={isSaving || !hasProjectSelected || assigneeOptions.length === 0}
                    onChange={(event) => {
                      updateField('assigneeUserId', event.target.value);
                    }}
                  >
                    <option value="">
                      {!hasProjectSelected
                        ? 'Select a project first'
                        : assigneeOptions.length === 0
                          ? 'No workspace users available'
                          : 'Unassigned'}
                    </option>
                    {assigneeOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName} ({user.email})
                      </option>
                    ))}
                  </NativeSelect>
                </ContactFormField>

                <ContactFormField label="Priority" htmlFor="taskPriority">
                  <NativeSelect
                    id="taskPriority"
                    label="Priority"
                    value={values.priority}
                    disabled={isSaving}
                    onChange={(event) => {
                      updateField('priority', event.target.value as TaskPriority);
                    }}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </NativeSelect>
                </ContactFormField>

                <ContactFormField label="Status" htmlFor="taskStatus">
                  <NativeSelect
                    id="taskStatus"
                    label="Status"
                    value={values.status}
                    disabled={isSaving}
                    onChange={(event) => {
                      updateField('status', event.target.value as TaskStatus);
                    }}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </NativeSelect>
                </ContactFormField>

                <ContactFormField
                  label="Start Date"
                  htmlFor="taskStartDate"
                  error={errors.startDate}
                >
                  <Input
                    id="taskStartDate"
                    type="date"
                    value={values.startDate}
                    onChange={(event) => {
                      updateField('startDate', event.target.value);
                    }}
                    disabled={isSaving}
                  />
                </ContactFormField>

                <ContactFormField label="Due Date" htmlFor="taskDueDate" error={errors.dueDate}>
                  <Input
                    id="taskDueDate"
                    type="date"
                    value={values.dueDate}
                    onChange={(event) => {
                      updateField('dueDate', event.target.value);
                    }}
                    disabled={isSaving}
                  />
                </ContactFormField>

                <ContactFormField
                  label="Estimated Hours"
                  htmlFor="taskEstimatedHours"
                  error={errors.estimatedHours}
                >
                  <Input
                    id="taskEstimatedHours"
                    type="number"
                    min={0}
                    step={0.25}
                    value={values.estimatedHours}
                    onChange={(event) => {
                      updateField('estimatedHours', event.target.value);
                    }}
                    placeholder="Optional"
                    disabled={isSaving}
                  />
                </ContactFormField>

                <ContactFormField
                  label="Description"
                  htmlFor="taskDescription"
                  error={errors.description}
                >
                  <textarea
                    id="taskDescription"
                    value={values.description}
                    onChange={(event) => {
                      updateField('description', event.target.value);
                    }}
                    placeholder="Optional description"
                    disabled={isSaving}
                    rows={4}
                    className={cn(
                      'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                      'ring-offset-background placeholder:text-muted-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  />
                </ContactFormField>
              </>
            )}

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
            <Button
              type="submit"
              disabled={
                isSaving ||
                isLoadingDependencies ||
                dependencyError !== null ||
                (!isEditMode && projectOptions.length === 0)
              }
              className="gap-2"
            >
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
