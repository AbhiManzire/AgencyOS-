'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import { ContactFormField } from '@/features/clients/contacts/components/contact-form-field';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import {
  areContactFormValuesEqual,
  contactToFormValues,
  DEFAULT_CONTACT_FORM_VALUES,
  validateContactForm,
} from '@/features/clients/contacts/forms/contact-form.validation';
import type {
  ContactFormErrors,
  ContactFormValues,
  ContactListItem,
  ContactStatus,
} from '@/features/clients/contacts/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export type ContactDrawerMode = 'create' | 'edit';

interface ContactFormDrawerProps {
  readonly open: boolean;
  readonly mode: ContactDrawerMode;
  readonly contact?: ContactListItem;
  readonly isPending?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (values: ContactFormValues) => Promise<void>;
}

export function ContactFormDrawer({
  open,
  mode,
  contact,
  isPending = false,
  onOpenChange,
  onSave,
}: ContactFormDrawerProps) {
  const { showToast } = useToast();
  const [values, setValues] = useState<ContactFormValues>(DEFAULT_CONTACT_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<ContactFormValues>(
    DEFAULT_CONTACT_FORM_VALUES,
  );
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSaving = isPending || isSubmitting;

  const isEditMode = mode === 'edit';
  const isDirty = useMemo(
    () => !areContactFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode && contact !== undefined) {
      const formValues = contactToFormValues(contact);
      setValues(formValues);
      setInitialValues(formValues);
    } else {
      setValues(DEFAULT_CONTACT_FORM_VALUES);
      setInitialValues(DEFAULT_CONTACT_FORM_VALUES);
    }

    setErrors({});
  }, [contact, isEditMode, open]);

  const updateField = <K extends keyof ContactFormValues>(
    field: K,
    value: ContactFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const errorKey = field as keyof ContactFormErrors;

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

    const validationErrors = validateContactForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(values);
      showToast(isEditMode ? 'Contact updated successfully' : 'Contact added successfully');
      closeDrawer();
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const drawerTitle = isEditMode ? 'Edit Contact' : 'Add Contact';
  const submitLabel = isEditMode ? 'Save Changes' : 'Save Contact';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="relative w-full max-w-md gap-0 p-0 sm:max-w-lg">
        <form
          className="flex h-full flex-col"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <header className="border-b border-border px-6 py-4 pr-12">
            <SectionTitle>{drawerTitle}</SectionTitle>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <section className="space-y-4">
              <SectionTitle className="text-base">Basic</SectionTitle>

              <ContactFormField
                label="First Name"
                htmlFor="firstName"
                required
                error={errors.firstName}
              >
                <Input
                  id="firstName"
                  value={values.firstName}
                  disabled={isSaving}
                  onChange={(event) => {
                    updateField('firstName', event.target.value);
                  }}
                />
              </ContactFormField>

              <ContactFormField label="Last Name" htmlFor="lastName">
                <Input
                  id="lastName"
                  value={values.lastName}
                  disabled={isSaving}
                  onChange={(event) => {
                    updateField('lastName', event.target.value);
                  }}
                />
              </ContactFormField>

              <ContactFormField label="Job Title" htmlFor="jobTitle">
                <Input
                  id="jobTitle"
                  value={values.jobTitle}
                  disabled={isSaving}
                  onChange={(event) => {
                    updateField('jobTitle', event.target.value);
                  }}
                />
              </ContactFormField>

              <ContactFormField label="Department" htmlFor="department">
                <Input
                  id="department"
                  value={values.department}
                  disabled={isSaving}
                  onChange={(event) => {
                    updateField('department', event.target.value);
                  }}
                />
              </ContactFormField>
            </section>

            <section className="space-y-4">
              <SectionTitle className="text-base">Communication</SectionTitle>

              <ContactFormField label="Email" htmlFor="email" error={errors.email}>
                <Input
                  id="email"
                  type="email"
                  value={values.email}
                  disabled={isSaving}
                  onChange={(event) => {
                    updateField('email', event.target.value);
                  }}
                />
              </ContactFormField>

              <ContactFormField label="Mobile" htmlFor="mobile" error={errors.mobile}>
                <Input
                  id="mobile"
                  type="tel"
                  value={values.mobile}
                  disabled={isSaving}
                  onChange={(event) => {
                    updateField('mobile', event.target.value);
                  }}
                />
              </ContactFormField>

              <ContactFormField label="Phone" htmlFor="phone" error={errors.phone}>
                <Input
                  id="phone"
                  type="tel"
                  value={values.phone}
                  disabled={isSaving}
                  onChange={(event) => {
                    updateField('phone', event.target.value);
                  }}
                />
              </ContactFormField>
            </section>

            <section className="space-y-4">
              <SectionTitle className="text-base">Business</SectionTitle>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPrimary"
                  checked={values.isPrimary}
                  disabled={isSaving}
                  onCheckedChange={(checked) => {
                    updateField('isPrimary', checked === true);
                  }}
                />
                <label htmlFor="isPrimary" className="text-sm text-foreground">
                  Is Primary Contact
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isDecisionMaker"
                  checked={values.isDecisionMaker}
                  disabled={isSaving}
                  onCheckedChange={(checked) => {
                    updateField('isDecisionMaker', checked === true);
                  }}
                />
                <label htmlFor="isDecisionMaker" className="text-sm text-foreground">
                  Decision Maker
                </label>
              </div>

              <ContactFormField label="Status" htmlFor="status">
                <NativeSelect
                  id="status"
                  label="Status"
                  value={values.status}
                  disabled={isSaving}
                  onChange={(event) => {
                    updateField('status', event.target.value as ContactStatus);
                  }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </NativeSelect>
              </ContactFormField>
            </section>

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
            <Button type="submit" disabled={isSaving || (isEditMode && !isDirty)} className="gap-2">
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
