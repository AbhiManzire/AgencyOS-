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
  isCreateClientFormValid,
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
import { cn } from '@/lib/utils';

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

function ClientFormFields({
  values,
  errors,
  isPending,
  isEditMode,
  updateField,
  updateCompany,
  validateField,
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
  readonly updateCompany: (companyValue: string) => void;
  readonly validateField: (field: keyof CreateClientFormValues) => void;
  readonly owners: readonly { id: string; displayName: string; email: string }[];
}) {
  return (
    <>
      <section className="space-y-4">
        <SectionTitle className="text-base">Company</SectionTitle>

        <FormField label="Company" htmlFor="company" required error={errors.company}>
          <Input
            id="company"
            value={values.company}
            onChange={(event) => {
              updateCompany(event.target.value);
            }}
            onBlur={() => {
              validateField('company');
            }}
            placeholder="Acme Corporation"
            disabled={isPending}
            aria-invalid={errors.company !== undefined}
            className={fieldClassName(errors.company)}
          />
        </FormField>

        <FormField label="Client Code" htmlFor="clientCode">
          <Input
            id="clientCode"
            value={
              isEditMode ? values.clientCode || '—' : 'Assigned automatically on save (CL-000001…)'
            }
            readOnly
            disabled
            className="bg-muted/40"
          />
        </FormField>

        <FormField label="Industry" htmlFor="industry" error={errors.industry}>
          <Input
            id="industry"
            value={values.industry}
            onChange={(event) => {
              updateField('industry', event.target.value);
            }}
            onBlur={() => {
              validateField('industry');
            }}
            placeholder="Technology"
            disabled={isPending}
            aria-invalid={errors.industry !== undefined}
            className={fieldClassName(errors.industry)}
          />
        </FormField>

        <FormField label="Status" htmlFor="status" error={errors.status}>
          <NativeSelect
            id="status"
            label="Status"
            value={values.status}
            disabled={isPending}
            className={cn(fieldClassName(errors.status))}
            onChange={(event) => {
              updateField('status', event.target.value as ClientStatus);
            }}
            onBlur={() => {
              validateField('status');
            }}
          >
            <option value="PROSPECT">Prospect</option>
            <option value="ACTIVE">Active</option>
            {isEditMode ? <option value="INACTIVE">Inactive</option> : null}
          </NativeSelect>
        </FormField>
      </section>

      <section className="space-y-4">
        <SectionTitle className="text-base">Primary Contact</SectionTitle>

        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => {
              updateField('email', event.target.value);
            }}
            onBlur={() => {
              validateField('email');
            }}
            placeholder="hello@company.com"
            disabled={isPending}
            aria-invalid={errors.email !== undefined}
            className={fieldClassName(errors.email)}
          />
        </FormField>

        <FormField label="Phone" htmlFor="phone" error={errors.phone}>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={values.phone}
            onChange={(event) => {
              updateField('phone', event.target.value.replace(/\D/g, '').slice(0, 15));
            }}
            onBlur={() => {
              validateField('phone');
            }}
            placeholder="9876543210"
            disabled={isPending}
            aria-invalid={errors.phone !== undefined}
            className={fieldClassName(errors.phone)}
          />
        </FormField>

        <FormField label="Website" htmlFor="website" error={errors.website}>
          <Input
            id="website"
            value={values.website}
            onChange={(event) => {
              updateField('website', event.target.value);
            }}
            onBlur={() => {
              validateField('website');
            }}
            placeholder="https://company.com"
            disabled={isPending}
            aria-invalid={errors.website !== undefined}
            className={fieldClassName(errors.website)}
          />
        </FormField>

        <FormField label="Owner" htmlFor="ownerUserId" error={errors.ownerUserId}>
          <NativeSelect
            id="ownerUserId"
            label="Owner"
            value={values.ownerUserId}
            disabled={isPending}
            className={cn(fieldClassName(errors.ownerUserId))}
            onChange={(event) => {
              updateField('ownerUserId', event.target.value);
            }}
            onBlur={() => {
              validateField('ownerUserId');
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
            onBlur={() => {
              validateField('addressLine1');
            }}
            disabled={isPending}
            aria-invalid={errors.addressLine1 !== undefined}
            className={fieldClassName(errors.addressLine1)}
          />
        </FormField>

        <FormField label="Address line 2" htmlFor="addressLine2" error={errors.addressLine2}>
          <Input
            id="addressLine2"
            value={values.addressLine2}
            onChange={(event) => {
              updateField('addressLine2', event.target.value);
            }}
            onBlur={() => {
              validateField('addressLine2');
            }}
            disabled={isPending}
            aria-invalid={errors.addressLine2 !== undefined}
            className={fieldClassName(errors.addressLine2)}
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
              onBlur={() => {
                validateField('city');
              }}
              disabled={isPending}
              aria-invalid={errors.city !== undefined}
              className={fieldClassName(errors.city)}
            />
          </FormField>

          <FormField label="State / region" htmlFor="stateRegion" error={errors.stateRegion}>
            <Input
              id="stateRegion"
              value={values.stateRegion}
              onChange={(event) => {
                updateField('stateRegion', event.target.value);
              }}
              onBlur={() => {
                validateField('stateRegion');
              }}
              disabled={isPending}
              aria-invalid={errors.stateRegion !== undefined}
              className={fieldClassName(errors.stateRegion)}
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
              onBlur={() => {
                validateField('postalCode');
              }}
              disabled={isPending}
              aria-invalid={errors.postalCode !== undefined}
              className={fieldClassName(errors.postalCode)}
            />
          </FormField>

          <FormField label="Country code" htmlFor="countryCode" error={errors.countryCode}>
            <Input
              id="countryCode"
              value={values.countryCode}
              onChange={(event) => {
                updateField('countryCode', event.target.value.toUpperCase());
              }}
              onBlur={() => {
                validateField('countryCode');
              }}
              placeholder="IN"
              maxLength={2}
              disabled={isPending}
              aria-invalid={errors.countryCode !== undefined}
              className={fieldClassName(errors.countryCode)}
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
            onBlur={() => {
              validateField('shippingAddressLine1');
            }}
            disabled={isPending}
            aria-invalid={errors.shippingAddressLine1 !== undefined}
            className={fieldClassName(errors.shippingAddressLine1)}
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
            onBlur={() => {
              validateField('shippingAddressLine2');
            }}
            disabled={isPending}
            aria-invalid={errors.shippingAddressLine2 !== undefined}
            className={fieldClassName(errors.shippingAddressLine2)}
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
              onBlur={() => {
                validateField('shippingCity');
              }}
              disabled={isPending}
              aria-invalid={errors.shippingCity !== undefined}
              className={fieldClassName(errors.shippingCity)}
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
              onBlur={() => {
                validateField('shippingStateRegion');
              }}
              disabled={isPending}
              aria-invalid={errors.shippingStateRegion !== undefined}
              className={fieldClassName(errors.shippingStateRegion)}
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
              onBlur={() => {
                validateField('shippingPostalCode');
              }}
              disabled={isPending}
              aria-invalid={errors.shippingPostalCode !== undefined}
              className={fieldClassName(errors.shippingPostalCode)}
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
              onBlur={() => {
                validateField('shippingCountryCode');
              }}
              placeholder="IN"
              maxLength={2}
              disabled={isPending}
              aria-invalid={errors.shippingCountryCode !== undefined}
              className={fieldClassName(errors.shippingCountryCode)}
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle className="text-base">Business Details</SectionTitle>

        <FormField label="Currency" htmlFor="currency" error={errors.currency}>
          <Input
            id="currency"
            value={values.currency}
            onChange={(event) => {
              updateField('currency', event.target.value.toUpperCase());
            }}
            onBlur={() => {
              validateField('currency');
            }}
            placeholder="INR"
            maxLength={3}
            disabled={isPending}
            aria-invalid={errors.currency !== undefined}
            className={fieldClassName(errors.currency)}
          />
        </FormField>

        <FormField label="GSTIN" htmlFor="gstin" error={errors.gstin}>
          <Input
            id="gstin"
            value={values.gstin}
            onChange={(event) => {
              updateField('gstin', event.target.value.toUpperCase());
            }}
            onBlur={() => {
              validateField('gstin');
            }}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
            disabled={isPending}
            aria-invalid={errors.gstin !== undefined}
            className={fieldClassName(errors.gstin)}
          />
        </FormField>

        <FormField label="PAN" htmlFor="pan" error={errors.pan}>
          <Input
            id="pan"
            value={values.pan}
            onChange={(event) => {
              updateField('pan', event.target.value.toUpperCase());
            }}
            onBlur={() => {
              validateField('pan');
            }}
            placeholder="AAAAA0000A"
            maxLength={10}
            disabled={isPending}
            aria-invalid={errors.pan !== undefined}
            className={fieldClassName(errors.pan)}
          />
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
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const isPending = isCreating || isUpdating;
  const isDirty = useMemo(
    () => !areClientFormValuesEqual(values, initialValues),
    [initialValues, values],
  );
  const formMode = isEditMode ? 'edit' : 'create';
  const isFormValid = useMemo(
    () => isCreateClientFormValid(values, { mode: formMode }),
    [formMode, values],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      setHasAttemptedSubmit(false);
      return;
    }

    if (isEditMode) {
      return;
    }

    setValues(DEFAULT_CREATE_CLIENT_FORM_VALUES);
    setInitialValues(DEFAULT_CREATE_CLIENT_FORM_VALUES);
    setErrors({});
    setHasAttemptedSubmit(false);
  }, [isEditMode, open]);

  useEffect(() => {
    if (!open || !isEditMode || client === undefined) {
      return;
    }

    const formValues = clientRecordToFormValues(client);
    setValues(formValues);
    setInitialValues(formValues);
    setErrors({});
    setHasAttemptedSubmit(false);
  }, [client, isEditMode, open]);

  const applyValues = (
    next: CreateClientFormValues,
    clearedField?: keyof CreateClientFormErrors,
  ): void => {
    setValues(next);

    if (hasAttemptedSubmit) {
      setErrors(validateCreateClientForm(next, { mode: formMode }));
      return;
    }

    if (clearedField === undefined) {
      return;
    }

    setErrors((currentErrors) => {
      if (currentErrors[clearedField] === undefined && currentErrors.form === undefined) {
        return currentErrors;
      }

      const { [clearedField]: _removed, form: _form, ...rest } = currentErrors;
      return rest;
    });
  };

  const updateCompany = (companyValue: string): void => {
    applyValues({ ...values, company: companyValue, displayName: companyValue }, 'company');
  };

  const updateField = <K extends keyof CreateClientFormValues>(
    field: K,
    value: CreateClientFormValues[K],
  ): void => {
    applyValues({ ...values, [field]: value }, field as keyof CreateClientFormErrors);
  };

  const validateField = (field: keyof CreateClientFormValues): void => {
    const nextErrors = validateCreateClientForm(values, { mode: formMode });
    const fieldError =
      field === 'status' || field === 'source'
        ? nextErrors.status
        : nextErrors[field as keyof CreateClientFormErrors];

    setErrors((current) => {
      const errorKey = field === 'source' ? 'form' : (field as keyof CreateClientFormErrors);
      if (fieldError === undefined) {
        if (current[errorKey] === undefined) {
          return current;
        }
        const { [errorKey]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [errorKey]: fieldError };
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
    if (isPending) {
      return;
    }

    setHasAttemptedSubmit(true);
    const validationErrors = validateCreateClientForm(values, { mode: formMode });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isEditMode) {
        await updateClient({ id: clientId, payload: toUpdateClientPayload(values) });
        showToast('Client updated successfully', 'success');
        closeDrawer();
        return;
      }

      const created = await createClient(toCreateClientPayload(values));
      showToast('Client created successfully', 'success');
      closeDrawer();
      router.push(`/clients/${created.id}`);
    } catch (error) {
      const apiFieldErrors = extractApiValidationErrors(error);
      const mappedErrors: CreateClientFormErrors = {};

      for (const [field, message] of Object.entries(apiFieldErrors)) {
        const formField = mapApiFieldToFormField(field);
        if (formField !== null && formField !== 'form') {
          mappedErrors[formField === 'displayName' ? 'company' : formField] = message;
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
  const submitLabel = isPending
    ? isEditMode
      ? 'Saving...'
      : 'Creating...'
    : isEditMode
      ? 'Save Changes'
      : 'Save Client';
  const isFormDisabled = isPending || (isEditMode && isLoadingClient);
  const canSubmit = !isFormDisabled && isFormValid && (!isEditMode || isDirty) && !isPending;

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
                  updateCompany={updateCompany}
                  validateField={validateField}
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
            <Button type="submit" disabled={!canSubmit} className="gap-2">
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
