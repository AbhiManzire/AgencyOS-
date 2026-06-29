'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import { ContactFormField } from '@/features/clients/contacts/components/contact-form-field';
import {
  areMemberFormValuesEqual,
  DEFAULT_MEMBER_FORM_VALUES,
  memberToFormValues,
  toCreateMemberPayload,
  toUpdateMemberPayload,
  validateMemberForm,
} from '@/features/projects/members/forms/member-form.validation';
import type {
  MemberFormErrors,
  MemberFormValues,
  ProjectMemberListItem,
  WorkspaceUserOption,
} from '@/features/projects/members/types';
import type { ProjectMemberRole } from '@/features/projects/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export type MemberDrawerMode = 'create' | 'edit';

interface MemberFormDrawerProps {
  readonly open: boolean;
  readonly mode: MemberDrawerMode;
  readonly member?: ProjectMemberListItem;
  readonly availableUsers: readonly WorkspaceUserOption[];
  readonly isPending?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (values: MemberFormValues, mode: MemberDrawerMode) => Promise<void>;
}

export function MemberFormDrawer({
  open,
  mode,
  member,
  availableUsers,
  isPending = false,
  onOpenChange,
  onSave,
}: MemberFormDrawerProps) {
  const { showToast } = useToast();
  const [values, setValues] = useState<MemberFormValues>(DEFAULT_MEMBER_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<MemberFormValues>(DEFAULT_MEMBER_FORM_VALUES);
  const [errors, setErrors] = useState<MemberFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = mode === 'edit';
  const isSaving = isPending || isSubmitting;
  const isDirty = useMemo(
    () => !areMemberFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode && member !== undefined) {
      const formValues = memberToFormValues(member);
      setValues(formValues);
      setInitialValues(formValues);
    } else {
      setValues(DEFAULT_MEMBER_FORM_VALUES);
      setInitialValues(DEFAULT_MEMBER_FORM_VALUES);
    }

    setErrors({});
  }, [isEditMode, member, open]);

  const updateField = <K extends keyof MemberFormValues>(
    field: K,
    value: MemberFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const errorKey = field as keyof MemberFormErrors;
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

    const validationErrors = validateMemberForm(values, isEditMode);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(values, mode);
      showToast(isEditMode ? 'Member updated successfully' : 'Member added successfully');
      closeDrawer();
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const drawerTitle = isEditMode ? 'Edit Member' : 'Add Member';
  const submitLabel = isEditMode ? 'Save Changes' : 'Add Member';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="relative w-full max-w-md gap-0 p-0 sm:max-w-lg">
        <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
          <header className="border-b border-border px-6 py-4 pr-12">
            <SectionTitle>{drawerTitle}</SectionTitle>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {isEditMode ? (
              <ContactFormField label="Workspace User" htmlFor="memberUser" required>
                <Input id="memberUser" value={member?.userDisplayName ?? ''} disabled />
              </ContactFormField>
            ) : (
              <ContactFormField
                label="Workspace User"
                htmlFor="userId"
                required
                error={errors.userId}
              >
                <NativeSelect
                  id="userId"
                  label="Workspace User"
                  value={values.userId}
                  disabled={isSaving || availableUsers.length === 0}
                  onChange={(event) => {
                    updateField('userId', event.target.value);
                  }}
                >
                  <option value="">
                    {availableUsers.length === 0 ? 'No workspace users available' : 'Select a user'}
                  </option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName} ({user.email})
                    </option>
                  ))}
                </NativeSelect>
              </ContactFormField>
            )}

            <ContactFormField label="Role" htmlFor="role">
              <NativeSelect
                id="role"
                label="Role"
                value={values.role}
                disabled={isSaving}
                onChange={(event) => {
                  updateField('role', event.target.value as ProjectMemberRole);
                }}
              >
                <option value="LEAD">Lead</option>
                <option value="MEMBER">Member</option>
                <option value="VIEWER">Viewer</option>
              </NativeSelect>
            </ContactFormField>

            <ContactFormField
              label="Allocation %"
              htmlFor="allocationPercent"
              error={errors.allocationPercent}
            >
              <Input
                id="allocationPercent"
                type="number"
                min={0}
                max={100}
                value={values.allocationPercent}
                onChange={(event) => {
                  updateField('allocationPercent', event.target.value);
                }}
                placeholder="Optional"
                disabled={isSaving}
              />
            </ContactFormField>

            <ContactFormField label="Start Date" htmlFor="startDate" error={errors.startDate}>
              <Input
                id="startDate"
                type="date"
                value={values.startDate}
                onChange={(event) => {
                  updateField('startDate', event.target.value);
                }}
                disabled={isSaving}
              />
            </ContactFormField>

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
              disabled={isSaving || (!isEditMode && availableUsers.length === 0)}
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

// Re-export payload helpers for tab usage
export { toCreateMemberPayload, toUpdateMemberPayload };
