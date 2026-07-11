'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import { useWorkspaceOwners } from '@/features/clients/hooks/use-workspace-owners';
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
  isEditMode,
  updateField,
  owners,
}: {
  readonly values: CreateClientFormValues;
  readonly errors: CreateClientFormErrors;
  readonly isPending: boolean;
  readonly isEditMode: boolean;
  readonly updateField: <K extends keyof CreateClientFormValues>(
    field: K,
    value: CreateClientFormValues[K],
  ) => void;
  readonly owners: readonly { id: string; displayName: string; email: string }[];
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
            value={values.website}
            onChange={(event) => {
              updateField('website', event.target.value);
            }}
            placeholder="company.com or https://company.com"
            disabled={isPending}
          />
        </FormField>
      </section>

      <section className="space-y-4">
        <SectionTitle className="text-base">Business</SectionTitle>

        <FormField label="Client Code" htmlFor="clientCode" error={errors.clientCode}>
          <Input
            id="clientCode"
            value={values.clientCode}
            onChange={(event) => {
              updateField('clientCode', event.target.value);
            }}
            placeholder="ACM-001"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Industry" htmlFor="industry" error={errors.industry}>
          <Input
            id="industry"
            value={values.industry}
            onChange={(event) => {
              updateField('industry', event.target.value);
            }}
            placeholder="Technology"
            disabled={isPending}
          />
        </FormField>

        <FormField label="Status" htmlFor="status" error={errors.status}>
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
            {isEditMode ? <option value="INACTIVE">Inactive</option> : null}
          </NativeSelect>
        </FormField>

        <FormField label="Owner" htmlFor="ownerUserId" error={errors.ownerUserId}>
          <NativeSelect
            id="ownerUserId"
            label="Owner"
            value={values.ownerUserId}
            disabled={isPending}
            onChange={(event) => {
              updateField('ownerUserId', event.target.value);
            }}
          >
            <option value="">Unassigned</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.displayName}
              </option>
            ))}
          </NativeSelect>
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

        <FormField label="Currency" htmlFor="currency" error={errors.currency}>
          <Input
            id="currency"
            value={values.currency}
            onChange={(event) => {
              updateField('currency', event.target.value.toUpperCase());
            }}
            placeholder="INR"
            maxLength={3}
            disabled={isPending}
          />
        </FormField>

        <FormField label="GSTIN" htmlFor="gstin" error={errors.gstin}>
          <Input
            id="gstin"
            value={values.gstin}
            onChange={(event) => {
              updateField('gstin', event.target.value.toUpperCase());
            }}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
            disabled={isPending}
          />
        </FormField>

        <FormField label="PAN" htmlFor="pan" error={errors.pan}>
          <Input
            id="pan"
            value={values.pan}
            onChange={(event) => {
              updateField('pan', event.target.value.toUpperCase());
            }}
            placeholder="AAAAA0000A"
            maxLength={10}
            disabled={isPending}
          />
        </FormField>
      </section>

      <section className="space-y-4">
        <SectionTitle className="text-base">Billing Address</SectionTitle>

        <FormField label="Address line 1" htmlFor="addressLine1" error={errors.addressLine1}>
          <Input
            id="addressLine1"
            value={values.addressLine1}
            onChange={(event) => {
              updateField('addressLine1', event.target.value);
            }}
            disabled={isPending}
          />
        </FormField>

        <FormField label="Address line 2" htmlFor="addressLine2" error={errors.addressLine2}>
          <Input
            id="addressLine2"
            value={values.addressLine2}
            onChange={(event) => {
              updateField('addressLine2', event.target.value);
            }}
            disabled={isPending}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="City" htmlFor="city" error={errors.city}>
            <Input
              id="city"
              value={values.city}
              onChange={(event) => {
                updateField('city', event.target.value);
              }}
              disabled={isPending}
            />
          </FormField>

          <FormField label="State / region" htmlFor="stateRegion" error={errors.stateRegion}>
            <Input
              id="stateRegion"
              value={values.stateRegion}
              onChange={(event) => {
                updateField('stateRegion', event.target.value);
              }}
              disabled={isPending}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Postal code" htmlFor="postalCode" error={errors.postalCode}>
            <Input
              id="postalCode"
              value={values.postalCode}
              onChange={(event) => {
                updateField('postalCode', event.target.value);
              }}
              disabled={isPending}
            />
          </FormField>

          <FormField label="Country code" htmlFor="countryCode" error={errors.countryCode}>
            <Input
              id="countryCode"
              value={values.countryCode}
              onChange={(event) => {
                updateField('countryCode', event.target.value.toUpperCase());
              }}
              placeholder="IN"
              maxLength={2}
              disabled={isPending}
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle className="text-base">Shipping Address</SectionTitle>

        <FormField
          label="Address line 1"
          htmlFor="shippingAddressLine1"
          error={errors.shippingAddressLine1}
        >
          <Input
            id="shippingAddressLine1"
            value={values.shippingAddressLine1}
            onChange={(event) => {
              updateField('shippingAddressLine1', event.target.value);
            }}
            disabled={isPending}
          />
        </FormField>

        <FormField
          label="Address line 2"
          htmlFor="shippingAddressLine2"
          error={errors.shippingAddressLine2}
        >
          <Input
            id="shippingAddressLine2"
            value={values.shippingAddressLine2}
            onChange={(event) => {
              updateField('shippingAddressLine2', event.target.value);
            }}
            disabled={isPending}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="City" htmlFor="shippingCity" error={errors.shippingCity}>
            <Input
              id="shippingCity"
              value={values.shippingCity}
              onChange={(event) => {
                updateField('shippingCity', event.target.value);
              }}
              disabled={isPending}
            />
          </FormField>

          <FormField
            label="State / region"
            htmlFor="shippingStateRegion"
            error={errors.shippingStateRegion}
          >
            <Input
              id="shippingStateRegion"
              value={values.shippingStateRegion}
              onChange={(event) => {
                updateField('shippingStateRegion', event.target.value);
              }}
              disabled={isPending}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Postal code"
            htmlFor="shippingPostalCode"
            error={errors.shippingPostalCode}
          >
            <Input
              id="shippingPostalCode"
              value={values.shippingPostalCode}
              onChange={(event) => {
                updateField('shippingPostalCode', event.target.value);
              }}
              disabled={isPending}
            />
          </FormField>

          <FormField
            label="Country code"
            htmlFor="shippingCountryCode"
            error={errors.shippingCountryCode}
          >
            <Input
              id="shippingCountryCode"
              value={values.shippingCountryCode}
              onChange={(event) => {
                updateField('shippingCountryCode', event.target.value.toUpperCase());
              }}
              placeholder="IN"
              maxLength={2}
              disabled={isPending}
            />
          </FormField>
        </div>
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
  const router = useRouter();
  const isEditMode = mode === 'edit' && clientId !== undefined && clientId.length > 0;
  const { showToast } = useToast();
  const { mutateAsync: createClient, isPending: isCreating } = useCreateClient();
  const { mutateAsync: updateClient, isPending: isUpdating } = useUpdateClient();
  const { data: owners = [] } = useWorkspaceOwners({ enabled: open });
  const {
    data: client,
    isLoading: isLoadingClient,
    error: loadError,
    refetch: refetchClient,
  } = useClient(clientId ?? '', { enabled: open && isEditMode, includeArchived: true });

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

    const validationErrors = validateCreateClientForm(values, {
      mode: isEditMode ? 'edit' : 'create',
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isEditMode) {
        await updateClient({ id: clientId, payload: toUpdateClientPayload(values) });
        showToast('Client updated successfully');
        closeDrawer();
        return;
      }

      const created = await createClient(toCreateClientPayload(values));
      showToast('Client created successfully');
      closeDrawer();
      router.push(`/clients/${created.id}`);
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
                  isEditMode={isEditMode}
                  updateField={updateField}
                  owners={owners}
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
