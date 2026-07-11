'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import {
  areVendorFormValuesEqual,
  DEFAULT_VENDOR_FORM_VALUES,
  toCreateVendorPayload,
  toUpdateVendorPayload,
  validateVendorForm,
  vendorRecordToFormValues,
  type VendorFormErrors,
  type VendorFormValues,
} from '@/features/finance/vendors/forms/vendor-form.validation';
import { useCreateVendor } from '@/features/finance/vendors/hooks/use-create-vendor';
import { useUpdateVendor } from '@/features/finance/vendors/hooks/use-update-vendor';
import { useVendor } from '@/features/finance/vendors/hooks/use-vendor';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export type VendorDrawerMode = 'create' | 'edit';

interface CreateVendorDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode?: VendorDrawerMode;
  readonly vendorId?: string;
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

export function CreateVendorDrawer({
  open,
  onOpenChange,
  mode = 'create',
  vendorId,
}: CreateVendorDrawerProps) {
  const router = useRouter();
  const isEditMode = mode === 'edit' && vendorId !== undefined && vendorId.length > 0;
  const { showToast } = useToast();
  const { mutateAsync: createVendor, isPending: isCreating } = useCreateVendor();
  const { mutateAsync: updateVendor, isPending: isUpdating } = useUpdateVendor();
  const {
    data: vendor,
    isLoading: isLoadingVendor,
    error: loadError,
    refetch: refetchVendor,
  } = useVendor(vendorId ?? '', { enabled: open && isEditMode });

  const [values, setValues] = useState<VendorFormValues>(DEFAULT_VENDOR_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<VendorFormValues>(DEFAULT_VENDOR_FORM_VALUES);
  const [errors, setErrors] = useState<VendorFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode) {
      return;
    }

    setValues(DEFAULT_VENDOR_FORM_VALUES);
    setInitialValues(DEFAULT_VENDOR_FORM_VALUES);
    setErrors({});
  }, [isEditMode, open]);

  useEffect(() => {
    if (!open || !isEditMode || vendor === undefined) {
      return;
    }

    const formValues = vendorRecordToFormValues(vendor);
    setValues(formValues);
    setInitialValues(formValues);
    setErrors({});
  }, [isEditMode, vendor, open]);

  const isDirty = !areVendorFormValuesEqual(values, initialValues);
  const isSaving = isCreating || isUpdating;
  const isFormDisabled = isSaving || (isEditMode && isLoadingVendor);

  const updateField = <K extends keyof VendorFormValues>(
    field: K,
    value: VendorFormValues[K],
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

    const nextErrors = validateVendorForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      if (isEditMode) {
        await updateVendor({ id: vendorId, payload: toUpdateVendorPayload(values) });
        showToast('Vendor updated', 'success');
        onOpenChange(false);
      } else {
        const created = await createVendor(toCreateVendorPayload(values));
        showToast('Vendor created', 'success');
        onOpenChange(false);
        router.push(`/finance/vendors/${created.id}`);
      }
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleCloseRequest}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <header className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              {isEditMode ? 'Edit Vendor' : 'Create Vendor'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditMode
                ? 'Update vendor details and payment terms.'
                : 'Add a supplier or vendor for expenses and bills.'}
            </p>
          </header>

          {isEditMode && isLoadingVendor ? (
            <LoadingState label="Loading vendor..." className="p-6" />
          ) : isEditMode && loadError ? (
            <div className="p-6">
              <ErrorState
                message={extractApiErrorMessage(loadError)}
                action={
                  <Button variant="outline" onClick={() => void refetchVendor()}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : (
            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                {errors.form ? (
                  <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                    {errors.form}
                  </p>
                ) : null}

                <section className="space-y-4">
                  <SectionTitle className="text-base">Details</SectionTitle>
                  <FormField label="Name" htmlFor="vendor-name" required error={errors.name}>
                    <Input
                      id="vendor-name"
                      value={values.name}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('name', event.target.value);
                      }}
                      autoComplete="organization"
                    />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Code" htmlFor="vendor-code">
                      <Input
                        id="vendor-code"
                        value={values.code}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('code', event.target.value);
                        }}
                      />
                    </FormField>
                    <FormField label="Currency" htmlFor="vendor-currency" error={errors.currency}>
                      <Input
                        id="vendor-currency"
                        value={values.currency}
                        disabled={isFormDisabled}
                        maxLength={3}
                        onChange={(event) => {
                          updateField('currency', event.target.value.toUpperCase());
                        }}
                      />
                    </FormField>
                  </div>
                  <FormField label="Contact person" htmlFor="vendor-contact">
                    <Input
                      id="vendor-contact"
                      value={values.contactPerson}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('contactPerson', event.target.value);
                      }}
                    />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Email" htmlFor="vendor-email" error={errors.email}>
                      <Input
                        id="vendor-email"
                        type="email"
                        value={values.email}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('email', event.target.value);
                        }}
                      />
                    </FormField>
                    <FormField label="Phone" htmlFor="vendor-phone">
                      <Input
                        id="vendor-phone"
                        value={values.phone}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('phone', event.target.value);
                        }}
                      />
                    </FormField>
                  </div>
                </section>

                <section className="space-y-4">
                  <SectionTitle className="text-base">Tax & terms</SectionTitle>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="GSTIN" htmlFor="vendor-gstin">
                      <Input
                        id="vendor-gstin"
                        value={values.gstin}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('gstin', event.target.value);
                        }}
                      />
                    </FormField>
                    <FormField label="PAN" htmlFor="vendor-pan">
                      <Input
                        id="vendor-pan"
                        value={values.pan}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('pan', event.target.value);
                        }}
                      />
                    </FormField>
                  </div>
                  <FormField
                    label="Payment terms (days)"
                    htmlFor="vendor-terms"
                    error={errors.paymentTermsDays}
                  >
                    <Input
                      id="vendor-terms"
                      type="number"
                      min={0}
                      step={1}
                      value={values.paymentTermsDays}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('paymentTermsDays', event.target.value);
                      }}
                    />
                  </FormField>
                  <FormField label="Notes" htmlFor="vendor-notes">
                    <textarea
                      id="vendor-notes"
                      rows={3}
                      value={values.notes}
                      disabled={isFormDisabled}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(event) => {
                        updateField('notes', event.target.value);
                      }}
                    />
                  </FormField>
                </section>
              </div>

              <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
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
                <Button type="submit" disabled={isFormDisabled} className="gap-2">
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isEditMode ? 'Save changes' : 'Create vendor'}
                </Button>
              </footer>
            </form>
          )}
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
