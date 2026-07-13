'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import { useClients } from '@/features/clients/hooks/use-clients';
import { useClientContacts } from '@/features/clients/contacts/hooks/use-client-contacts';
import {
  areProjectFormValuesEqual,
  DEFAULT_CREATE_PROJECT_FORM_VALUES,
  mapApiFieldToFormField,
  parseTagNames,
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  projectRecordToFormValues,
  toCreateProjectPayload,
  toUpdateProjectPayload,
  validateCreateProjectForm,
  type CreateProjectFormErrors,
  type CreateProjectFormValues,
} from '@/features/projects/forms/create-project.validation';
import { useCreateProject } from '@/features/projects/hooks/use-create-project';
import { useProject } from '@/features/projects/hooks/use-project';
import {
  useProjectDepartments,
  useProjectWorkspaceOwners,
} from '@/features/projects/hooks/use-project-meta';
import { useUpdateProject } from '@/features/projects/hooks/use-update-project';
import { assignProjectTag } from '@/features/projects/tags/api/project-tags.api';
import {
  PROJECT_SERVICE_TYPE_LABELS,
  PROJECT_SERVICE_TYPES,
  type ProjectServiceType,
} from '@/features/projects/templates/api/template.types';
import { useProjectTemplates } from '@/features/projects/templates/hooks/use-project-templates';
import type { ProjectPriority, ProjectStatus } from '@/features/projects/types';
import { extractApiErrorMessage, extractApiValidationErrors } from '@/lib/api/extract-api-error';
import { cn } from '@/lib/utils';

interface CreateProjectDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode?: 'create' | 'edit';
  readonly projectId?: string;
  /** Prefills and locks client when creating from a client context. */
  readonly defaultClientId?: string;
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
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

function ProjectFormFields({
  values,
  errors,
  isPending,
  isEditMode,
  isLoadingClients,
  clientsError,
  clientOptions,
  ownerOptions,
  departmentOptions,
  templateOptions,
  contactOptions,
  clientLocked,
  onRetryClients,
  updateField,
}: {
  readonly values: CreateProjectFormValues;
  readonly errors: CreateProjectFormErrors;
  readonly isPending: boolean;
  readonly isEditMode: boolean;
  readonly isLoadingClients: boolean;
  readonly clientsError: unknown;
  readonly clientOptions: readonly { id: string; label: string }[];
  readonly ownerOptions: readonly { id: string; label: string }[];
  readonly departmentOptions: readonly { id: string; label: string }[];
  readonly templateOptions: readonly { id: string; label: string }[];
  readonly contactOptions: readonly { id: string; label: string }[];
  readonly clientLocked: boolean;
  readonly onRetryClients: () => void;
  readonly updateField: <K extends keyof CreateProjectFormValues>(
    field: K,
    value: CreateProjectFormValues[K],
  ) => void;
}) {
  if (isLoadingClients) {
    return <LoadingState label="Loading clients..." />;
  }

  if (clientsError) {
    return (
      <ErrorState
        message={extractApiErrorMessage(clientsError)}
        action={
          <Button variant="outline" onClick={onRetryClients}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <>
      <section className="space-y-4">
        <SectionTitle className="text-base">Project Details</SectionTitle>

        <FormField label="Project Name" htmlFor="projectName" required error={errors.name}>
          <Input
            id="projectName"
            value={values.name}
            onChange={(event) => {
              updateField('name', event.target.value);
            }}
            placeholder="Website Redesign"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Project Code" htmlFor="projectCode" error={errors.code}>
          <Input
            id="projectCode"
            value={values.code}
            onChange={(event) => {
              updateField('code', event.target.value);
            }}
            placeholder="WR-2026"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Client" htmlFor="clientId" required error={errors.clientId}>
          <NativeSelect
            id="clientId"
            label="Client"
            value={values.clientId}
            disabled={isPending || isEditMode || clientLocked || clientOptions.length === 0}
            onChange={(event) => {
              updateField('clientId', event.target.value);
              updateField('primaryContactId', '');
            }}
          >
            <option value="">
              {clientOptions.length === 0 ? 'No active clients available' : 'Select a client'}
            </option>
            {clientOptions.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField label="Template" htmlFor="templateId" error={errors.templateId}>
          <NativeSelect
            id="templateId"
            label="Template"
            value={values.templateId}
            disabled={isPending}
            onChange={(event) => {
              updateField('templateId', event.target.value);
            }}
          >
            <option value="">No template</option>
            {templateOptions.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField label="Service type" htmlFor="serviceType" error={errors.serviceType}>
          <NativeSelect
            id="serviceType"
            label="Service type"
            value={values.serviceType}
            disabled={isPending}
            onChange={(event) => {
              updateField('serviceType', event.target.value as '' | ProjectServiceType);
            }}
          >
            <option value="">Not set</option>
            {PROJECT_SERVICE_TYPES.map((serviceType) => (
              <option key={serviceType} value={serviceType}>
                {PROJECT_SERVICE_TYPE_LABELS[serviceType]}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField
          label="Primary contact"
          htmlFor="primaryContactId"
          error={errors.primaryContactId}
        >
          <NativeSelect
            id="primaryContactId"
            label="Primary contact"
            value={values.primaryContactId}
            disabled={isPending || values.clientId.length === 0}
            onChange={(event) => {
              updateField('primaryContactId', event.target.value);
            }}
          >
            <option value="">
              {values.clientId.length === 0 ? 'Select a client first' : 'No primary contact'}
            </option>
            {contactOptions.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField label="Status" htmlFor="status">
          <NativeSelect
            id="status"
            label="Status"
            value={values.status}
            disabled={isPending}
            onChange={(event) => {
              updateField('status', event.target.value as ProjectStatus);
            }}
          >
            {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[])
              .filter((status) => status !== 'ARCHIVED')
              .map((status) => (
                <option key={status} value={status}>
                  {PROJECT_STATUS_LABELS[status]}
                </option>
              ))}
          </NativeSelect>
        </FormField>

        <FormField label="Priority" htmlFor="priority">
          <NativeSelect
            id="priority"
            label="Priority"
            value={values.priority}
            disabled={isPending}
            onChange={(event) => {
              updateField('priority', event.target.value as ProjectPriority);
            }}
          >
            {(Object.keys(PROJECT_PRIORITY_LABELS) as ProjectPriority[]).map((priority) => (
              <option key={priority} value={priority}>
                {PROJECT_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField label="Description" htmlFor="description" error={errors.description}>
          <textarea
            id="description"
            value={values.description}
            onChange={(event) => {
              updateField('description', event.target.value);
            }}
            placeholder="Project scope and objectives"
            disabled={isPending}
            rows={4}
            className={cn(
              'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
              'ring-offset-background placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />
        </FormField>

        {!isEditMode ? (
          <FormField label="Tags" htmlFor="tags" error={errors.tags}>
            <Input
              id="tags"
              value={values.tags}
              onChange={(event) => {
                updateField('tags', event.target.value);
              }}
              placeholder="Comma-separated tags"
              disabled={isPending}
            />
          </FormField>
        ) : null}
      </section>

      <section className="space-y-4">
        <SectionTitle className="text-base">Schedule & Ownership</SectionTitle>

        <FormField label="Start Date" htmlFor="startDate" error={errors.startDate}>
          <Input
            id="startDate"
            type="date"
            value={values.startDate}
            onChange={(event) => {
              updateField('startDate', event.target.value);
            }}
            disabled={isPending}
          />
        </FormField>

        <FormField label="End Date" htmlFor="endDate" error={errors.endDate}>
          <Input
            id="endDate"
            type="date"
            value={values.endDate}
            onChange={(event) => {
              updateField('endDate', event.target.value);
            }}
            disabled={isPending}
          />
        </FormField>

        <FormField
          label="Project Owner"
          htmlFor="projectManagerUserId"
          required
          error={errors.projectManagerUserId}
        >
          <NativeSelect
            id="projectManagerUserId"
            label="Project Owner"
            value={values.projectManagerUserId}
            disabled={isPending || ownerOptions.length === 0}
            onChange={(event) => {
              updateField('projectManagerUserId', event.target.value);
            }}
          >
            <option value="">
              {ownerOptions.length === 0 ? 'No workspace members available' : 'Select an owner'}
            </option>
            {ownerOptions.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField label="Department" htmlFor="departmentId" error={errors.departmentId}>
          <NativeSelect
            id="departmentId"
            label="Department"
            value={values.departmentId}
            disabled={isPending}
            onChange={(event) => {
              updateField('departmentId', event.target.value);
            }}
          >
            <option value="">No department</option>
            {departmentOptions.map((department) => (
              <option key={department.id} value={department.id}>
                {department.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField label="Budget" htmlFor="budgetAmount" error={errors.budgetAmount}>
          <Input
            id="budgetAmount"
            type="number"
            min={0}
            step="0.01"
            value={values.budgetAmount}
            onChange={(event) => {
              updateField('budgetAmount', event.target.value);
            }}
            placeholder="0.00"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Estimated Hours" htmlFor="estimatedHours" error={errors.estimatedHours}>
          <Input
            id="estimatedHours"
            type="number"
            min={0}
            step="0.01"
            value={values.estimatedHours}
            onChange={(event) => {
              updateField('estimatedHours', event.target.value);
            }}
            placeholder="0"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Actual Hours" htmlFor="actualHours" error={errors.actualHours}>
          <Input
            id="actualHours"
            type="number"
            min={0}
            step="0.01"
            value={values.actualHours}
            onChange={(event) => {
              updateField('actualHours', event.target.value);
            }}
            placeholder="0"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Billable" htmlFor="isBillable">
          <NativeSelect
            id="isBillable"
            label="Billable"
            value={values.isBillable}
            disabled={isPending}
            onChange={(event) => {
              updateField('isBillable', event.target.value as 'yes' | 'no');
            }}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </NativeSelect>
        </FormField>
      </section>
    </>
  );
}

export function CreateProjectDrawer({
  open,
  onOpenChange,
  mode = 'create',
  projectId,
  defaultClientId,
}: CreateProjectDrawerProps) {
  const isEditMode = mode === 'edit' && projectId !== undefined && projectId.length > 0;
  const { showToast } = useToast();
  const { mutateAsync: createProject, isPending: isCreating } = useCreateProject();
  const { mutateAsync: updateProject, isPending: isUpdating } = useUpdateProject();
  const {
    data: project,
    isLoading: isLoadingProject,
    error: loadError,
    refetch: refetchProject,
  } = useProject(projectId ?? '', { enabled: open && isEditMode });
  const {
    data: clientsData,
    isLoading: isLoadingClients,
    error: clientsError,
    refetch: refetchClients,
  } = useClients({ take: 100 }, { enabled: open });
  const { data: owners = [] } = useProjectWorkspaceOwners({ enabled: open });
  const { data: departments = [] } = useProjectDepartments({ enabled: open });
  const { data: templatesData } = useProjectTemplates(
    { take: 100, isActive: true },
    { enabled: open },
  );

  const [values, setValues] = useState<CreateProjectFormValues>(DEFAULT_CREATE_PROJECT_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<CreateProjectFormValues>(
    DEFAULT_CREATE_PROJECT_FORM_VALUES,
  );
  const [errors, setErrors] = useState<CreateProjectFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const selectedClientId = values.clientId;
  const { data: contacts = [] } = useClientContacts(selectedClientId);

  const clientOptions = useMemo(() => {
    if (!clientsData) {
      return [];
    }

    return clientsData.items
      .filter((client) => client.deletedAt === null)
      .map((client) => ({
        id: client.id,
        label: client.displayName,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [clientsData]);

  const ownerOptions = useMemo(
    () =>
      owners.map((owner) => ({
        id: owner.id,
        label: owner.displayName,
      })),
    [owners],
  );

  const departmentOptions = useMemo(
    () =>
      departments.map((department) => ({
        id: department.id,
        label: department.name,
      })),
    [departments],
  );

  const templateOptions = useMemo(
    () =>
      (templatesData?.items ?? []).map((template) => ({
        id: template.id,
        label: template.name,
      })),
    [templatesData],
  );

  const contactOptions = useMemo(
    () =>
      contacts.map((contact) => ({
        id: contact.id,
        label:
          [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
          contact.email ||
          contact.id,
      })),
    [contacts],
  );

  const clientLocked = Boolean(defaultClientId) && !isEditMode;

  const isDirty = useMemo(
    () => !areProjectFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode) {
      return;
    }

    const defaults: CreateProjectFormValues = {
      ...DEFAULT_CREATE_PROJECT_FORM_VALUES,
      ...(defaultClientId ? { clientId: defaultClientId } : {}),
    };
    setValues(defaults);
    setInitialValues(defaults);
    setErrors({});
  }, [defaultClientId, isEditMode, open]);

  useEffect(() => {
    if (!open || !isEditMode || project === undefined) {
      return;
    }

    const formValues = projectRecordToFormValues(project);
    setValues(formValues);
    setInitialValues(formValues);
    setErrors({});
  }, [isEditMode, open, project]);

  const isPending = isCreating || isUpdating;

  const updateField = <K extends keyof CreateProjectFormValues>(
    field: K,
    value: CreateProjectFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const errorKey = field as keyof CreateProjectFormErrors;

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

    const validationErrors = validateCreateProjectForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isEditMode) {
        await updateProject({ id: projectId, payload: toUpdateProjectPayload(values) });
        showToast('Project updated successfully');
      } else {
        const created = await createProject(toCreateProjectPayload(values));
        const tagNames = parseTagNames(values.tags);
        for (const name of tagNames) {
          await assignProjectTag(created.id, { name });
        }
        showToast('Project created successfully');
      }

      closeDrawer();
    } catch (error) {
      const apiFieldErrors = extractApiValidationErrors(error);
      const mappedErrors: CreateProjectFormErrors = {};

      for (const [field, message] of Object.entries(apiFieldErrors)) {
        const formField = mapApiFieldToFormField(field);
        if (formField !== null && formField !== 'form') {
          mappedErrors[formField] = message;
        }
      }

      if (Object.keys(mappedErrors).length > 0) {
        mappedErrors.form = extractApiErrorMessage(error);
        setErrors(mappedErrors);
        return;
      }

      setErrors({ form: extractApiErrorMessage(error) });
    }
  };

  const drawerTitle = isEditMode ? 'Edit Project' : 'Create Project';
  const submitLabel = isEditMode ? 'Save Changes' : 'Save Project';
  const isFormDisabled = isPending || isLoadingClients || (isEditMode && isLoadingProject);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="relative w-full max-w-md gap-0 p-0 sm:max-w-lg">
        <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
          <header className="border-b border-border px-6 py-4 pr-12">
            <SectionTitle>{drawerTitle}</SectionTitle>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {isEditMode && isLoadingProject ? (
              <LoadingState label="Loading project..." />
            ) : isEditMode && loadError ? (
              <ErrorState
                message={extractApiErrorMessage(loadError)}
                action={
                  <Button variant="outline" onClick={() => void refetchProject()}>
                    Try again
                  </Button>
                }
              />
            ) : (
              <>
                <ProjectFormFields
                  values={values}
                  errors={errors}
                  isPending={isFormDisabled}
                  isEditMode={isEditMode}
                  isLoadingClients={isLoadingClients}
                  clientsError={clientsError}
                  clientOptions={clientOptions}
                  ownerOptions={ownerOptions}
                  departmentOptions={departmentOptions}
                  templateOptions={templateOptions}
                  contactOptions={contactOptions}
                  clientLocked={clientLocked}
                  onRetryClients={() => {
                    void refetchClients();
                  }}
                  updateField={updateField}
                />

                {errors.form ? (
                  <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger-foreground">
                    {errors.form}
                  </p>
                ) : null}
              </>
            )}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" disabled={isPending} onClick={requestClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isFormDisabled ||
                (!isEditMode && clientOptions.length === 0) ||
                (isEditMode && !isDirty)
              }
              className="gap-2"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
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
