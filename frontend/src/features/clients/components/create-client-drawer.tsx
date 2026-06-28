'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import {
  areClientFormValuesEqual,
  clientRecordToFormValues,
  DEFAULT_CREATE_CLIENT_FORM_VALUES,
  mapApiFieldToFormField,
  toCreateClientPayload,
  toUpdateClientPayload,
  validateCreateClientForm,
  type CreateClientFormErrors,
  type CreateClientFormValues,
} from '@/features/clients/forms/create-client.validation';
import { useClient } from '@/features/clients/hooks/use-client';
import { useCreateClient } from '@/features/clients/hooks/use-create-client';
import { useUpdateClient } from '@/features/clients/hooks/use-update-client';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import type { ClientSource, ClientStatus } from '@/features/clients/types';
import { extractApiErrorMessage, extractApiValidationErrors } from '@/lib/api/extract-api-error';

export type ClientDrawerMode = 'create' | 'edit';

interface CreateClientDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode?: ClientDrawerMode;
  readonly clientId?: string;
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

function ClientFormFields({
  values,
  errors,
  isPending,
  updateField,
}: {
  readonly values: CreateClientFormValues;
  readonly errors: CreateClientFormErrors;
  readonly isPending: boolean;
  readonly updateField: <K extends keyof CreateClientFormValues>(
    field: K,
    value: CreateClientFormValues[K],
  ) => void;
}) {
  return (
    <>
      <section className="space-y-4">
        <SectionTitle className="text-base">Basic Information</SectionTitle>

        <FormField label="Display Name" htmlFor="displayName" required error={errors.displayName}>
          <Input
            id="displayName"
            value={values.displayName}
            onChange={(event) => {
              updateField('displayName', event.target.value);
            }}
            placeholder="Acme Corporation"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Company" htmlFor="company" error={errors.company}>
          <Input
            id="company"
            value={values.company}
            onChange={(event) => {
              updateField('company', event.target.value);
            }}
            placeholder="Legal company name"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => {
              updateField('email', event.target.value);
            }}
            placeholder="hello@company.com"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Phone" htmlFor="phone" error={errors.phone}>
          <Input
            id="phone"
            type="tel"
            value={values.phone}
            onChange={(event) => {
              updateField('phone', event.target.value);
            }}
            placeholder="+1 (555) 010-0000"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Website" htmlFor="website" error={errors.website}>
          <Input
            id="website"
            type="url"
            value={values.website}
            onChange={(event) => {
              updateField('website', event.target.value);
            }}
            placeholder="https://company.com"
            disabled={isPending}
          />
        </FormField>
      </section>

      <section className="space-y-4">
        <SectionTitle className="text-base">Business</SectionTitle>

        <FormField label="Status" htmlFor="status">
          <NativeSelect
            id="status"
            label="Status"
            value={values.status}
            disabled={isPending}
            onChange={(event) => {
              updateField('status', event.target.value as ClientStatus);
            }}
          >
            <option value="PROSPECT">Prospect</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </NativeSelect>
        </FormField>

        <FormField label="Owner" htmlFor="ownerUserId" error={errors.ownerUserId}>
          <Input
            id="ownerUserId"
            value={values.ownerUserId}
            onChange={(event) => {
              updateField('ownerUserId', event.target.value);
            }}
            placeholder="Owner user ID (optional)"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Source" htmlFor="source">
          <NativeSelect
            id="source"
            label="Source"
            value={values.source}
            disabled={isPending}
            onChange={(event) => {
              updateField('source', event.target.value as ClientSource | '');
            }}
          >
            <option value="">Select source (optional)</option>
            <option value="REFERRAL">Referral</option>
            <option value="INBOUND">Inbound</option>
            <option value="OUTBOUND">Outbound</option>
            <option value="IMPORT">Import</option>
            <option value="SALES_CONVERSION">Sales conversion</option>
          </NativeSelect>
        </FormField>
      </section>
    </>
  );
}

export function CreateClientDrawer({
  open,
  onOpenChange,
  mode = 'create',
  clientId,
}: CreateClientDrawerProps) {
  const isEditMode = mode === 'edit' && clientId !== undefined && clientId.length > 0;
  const { showToast } = useToast();
  const { mutateAsync: createClient, isPending: isCreating } = useCreateClient();
  const { mutateAsync: updateClient, isPending: isUpdating } = useUpdateClient();
  const {
    data: client,
    isLoading: isLoadingClient,
    error: loadError,
    refetch: refetchClient,
  } = useClient(clientId ?? '', { enabled: open && isEditMode });

  const [values, setValues] = useState<CreateClientFormValues>(DEFAULT_CREATE_CLIENT_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<CreateClientFormValues>(
    DEFAULT_CREATE_CLIENT_FORM_VALUES,
  );
  const [errors, setErrors] = useState<CreateClientFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const isPending = isCreating || isUpdating;
  const isDirty = useMemo(
    () => !areClientFormValuesEqual(values, initialValues),
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

    setValues(DEFAULT_CREATE_CLIENT_FORM_VALUES);
    setInitialValues(DEFAULT_CREATE_CLIENT_FORM_VALUES);
    setErrors({});
  }, [isEditMode, open]);

  useEffect(() => {
    if (!open || !isEditMode || client === undefined) {
      return;
    }

    const formValues = clientRecordToFormValues(client);
    setValues(formValues);
    setInitialValues(formValues);
    setErrors({});
  }, [client, isEditMode, open]);

  const updateField = <K extends keyof CreateClientFormValues>(
    field: K,
    value: CreateClientFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const errorKey = field as keyof CreateClientFormErrors;

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

    const validationErrors = validateCreateClientForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isEditMode) {
        await updateClient({ id: clientId, payload: toUpdateClientPayload(values) });
        showToast('Client updated successfully');
      } else {
        await createClient(toCreateClientPayload(values));
        showToast('Client created successfully');
      }

      closeDrawer();
    } catch (error) {
      const apiFieldErrors = extractApiValidationErrors(error);
      const mappedErrors: CreateClientFormErrors = {};

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

  const drawerTitle = isEditMode ? 'Edit Client' : 'Create Client';
  const submitLabel = isEditMode ? 'Save Changes' : 'Save Client';
  const isFormDisabled = isPending || (isEditMode && isLoadingClient);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="relative w-full max-w-md gap-0 p-0 sm:max-w-lg">
        <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
          <header className="border-b border-border px-6 py-4 pr-12">
            <SectionTitle>{drawerTitle}</SectionTitle>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {isEditMode && isLoadingClient ? (
              <LoadingState label="Loading client..." />
            ) : isEditMode && loadError ? (
              <ErrorState
                message={extractApiErrorMessage(loadError)}
                action={
                  <Button variant="outline" onClick={() => void refetchClient()}>
                    Try again
                  </Button>
                }
              />
            ) : (
              <>
                <ClientFormFields
                  values={values}
                  errors={errors}
                  isPending={isFormDisabled}
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
              disabled={isFormDisabled || (isEditMode && !isDirty)}
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
