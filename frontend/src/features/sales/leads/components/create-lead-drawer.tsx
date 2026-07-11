'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import { useWorkspaceOwners } from '@/features/clients/hooks/use-workspace-owners';
import {
  areLeadFormValuesEqual,
  DEFAULT_LEAD_FORM_VALUES,
  leadRecordToFormValues,
  toCreateLeadPayload,
  toUpdateLeadPayload,
  validateLeadForm,
  type LeadFormErrors,
  type LeadFormValues,
} from '@/features/sales/leads/forms/lead-form.validation';
import { useCreateLead } from '@/features/sales/leads/hooks/use-create-lead';
import { useLead } from '@/features/sales/leads/hooks/use-lead';
import { useUpdateLead } from '@/features/sales/leads/hooks/use-update-lead';
import type { CreateLeadStatus, LeadPriority, LeadSource } from '@/features/sales/leads/types';
import {
  LEAD_PRIORITY_LABELS,
  LEAD_SOURCE_LABELS,
} from '@/features/sales/leads/utils/lead-display';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export type LeadDrawerMode = 'create' | 'edit';

interface CreateLeadDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode?: LeadDrawerMode;
  readonly leadId?: string;
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

export function CreateLeadDrawer({
  open,
  onOpenChange,
  mode = 'create',
  leadId,
}: CreateLeadDrawerProps) {
  const router = useRouter();
  const isEditMode = mode === 'edit' && leadId !== undefined && leadId.length > 0;
  const { showToast } = useToast();
  const { mutateAsync: createLead, isPending: isCreating } = useCreateLead();
  const { mutateAsync: updateLead, isPending: isUpdating } = useUpdateLead();
  const { data: owners = [] } = useWorkspaceOwners();
  const {
    data: lead,
    isLoading: isLoadingLead,
    error: loadError,
    refetch: refetchLead,
  } = useLead(leadId ?? '', { enabled: open && isEditMode });

  const [values, setValues] = useState<LeadFormValues>(DEFAULT_LEAD_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<LeadFormValues>(DEFAULT_LEAD_FORM_VALUES);
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode) {
      return;
    }

    setValues(DEFAULT_LEAD_FORM_VALUES);
    setInitialValues(DEFAULT_LEAD_FORM_VALUES);
    setErrors({});
  }, [isEditMode, open]);

  useEffect(() => {
    if (!open || !isEditMode || lead === undefined) {
      return;
    }

    const formValues = leadRecordToFormValues(lead);
    setValues(formValues);
    setInitialValues(formValues);
    setErrors({});
  }, [isEditMode, lead, open]);

  const isDirty = !areLeadFormValuesEqual(values, initialValues);
  const isSaving = isCreating || isUpdating;
  const isFormDisabled = isSaving || (isEditMode && isLoadingLead);

  const updateField = <K extends keyof LeadFormValues>(
    field: K,
    value: LeadFormValues[K],
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

    const nextErrors = validateLeadForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      if (isEditMode) {
        await updateLead({ id: leadId, payload: toUpdateLeadPayload(values) });
        showToast('Lead updated', 'success');
        onOpenChange(false);
      } else {
        const created = await createLead(toCreateLeadPayload(values));
        showToast('Lead created', 'success');
        onOpenChange(false);
        router.push(`/sales/leads/${created.id}`);
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
              {isEditMode ? 'Edit Lead' : 'Create Lead'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditMode
                ? 'Update lead details and qualification fields.'
                : 'Capture a new sales lead for the pipeline.'}
            </p>
          </header>

          {isEditMode && isLoadingLead ? (
            <LoadingState label="Loading lead..." className="p-6" />
          ) : isEditMode && loadError ? (
            <div className="p-6">
              <ErrorState
                message={extractApiErrorMessage(loadError)}
                action={
                  <Button variant="outline" onClick={() => void refetchLead()}>
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
                  <SectionTitle className="text-base">Company</SectionTitle>

                  <FormField label="Company" htmlFor="company" required error={errors.company}>
                    <Input
                      id="company"
                      value={values.company}
                      onChange={(event) => {
                        updateField('company', event.target.value);
                      }}
                      placeholder="Acme Corp"
                      disabled={isFormDisabled}
                    />
                  </FormField>

                  <FormField label="Code" htmlFor="code">
                    <Input
                      id="code"
                      value={values.code}
                      onChange={(event) => {
                        updateField('code', event.target.value);
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormField>

                  <FormField label="Contact person" htmlFor="contactPerson">
                    <Input
                      id="contactPerson"
                      value={values.contactPerson}
                      onChange={(event) => {
                        updateField('contactPerson', event.target.value);
                      }}
                      disabled={isFormDisabled}
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
                      disabled={isFormDisabled}
                    />
                  </FormField>

                  <FormField label="Phone" htmlFor="phone">
                    <Input
                      id="phone"
                      value={values.phone}
                      onChange={(event) => {
                        updateField('phone', event.target.value);
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormField>

                  <FormField label="WhatsApp" htmlFor="whatsapp">
                    <Input
                      id="whatsapp"
                      value={values.whatsapp}
                      onChange={(event) => {
                        updateField('whatsapp', event.target.value);
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormField>

                  <FormField label="Website" htmlFor="website">
                    <Input
                      id="website"
                      value={values.website}
                      onChange={(event) => {
                        updateField('website', event.target.value);
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormField>

                  <FormField label="Industry" htmlFor="industry">
                    <Input
                      id="industry"
                      value={values.industry}
                      onChange={(event) => {
                        updateField('industry', event.target.value);
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormField>

                  <FormField label="Country" htmlFor="country">
                    <Input
                      id="country"
                      value={values.country}
                      onChange={(event) => {
                        updateField('country', event.target.value);
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormField>
                </section>

                <section className="space-y-4">
                  <SectionTitle className="text-base">Pipeline</SectionTitle>

                  <FormField label="Status" htmlFor="status">
                    <NativeSelect
                      id="status"
                      label="Status"
                      value={values.status}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('status', event.target.value as CreateLeadStatus);
                      }}
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUALIFIED">Qualified</option>
                    </NativeSelect>
                  </FormField>

                  <FormField label="Priority" htmlFor="priority">
                    <NativeSelect
                      id="priority"
                      label="Priority"
                      value={values.priority}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('priority', event.target.value as LeadPriority);
                      }}
                    >
                      {(Object.keys(LEAD_PRIORITY_LABELS) as LeadPriority[]).map((key) => (
                        <option key={key} value={key}>
                          {LEAD_PRIORITY_LABELS[key]}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>

                  <FormField label="Source" htmlFor="source">
                    <NativeSelect
                      id="source"
                      label="Source"
                      value={values.source}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('source', event.target.value as LeadSource | '');
                      }}
                    >
                      <option value="">Select source</option>
                      {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((key) => (
                        <option key={key} value={key}>
                          {LEAD_SOURCE_LABELS[key]}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>

                  <FormField label="Assignee" htmlFor="assignedToUserId">
                    <NativeSelect
                      id="assignedToUserId"
                      label="Assignee"
                      value={values.assignedToUserId}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('assignedToUserId', event.target.value);
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

                  <FormField label="Lead score" htmlFor="leadScore" error={errors.leadScore}>
                    <Input
                      id="leadScore"
                      type="number"
                      min={0}
                      max={100}
                      value={values.leadScore}
                      onChange={(event) => {
                        updateField('leadScore', event.target.value);
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormField>

                  <FormField
                    label="Expected deal size"
                    htmlFor="expectedDealSize"
                    error={errors.expectedDealSize}
                  >
                    <Input
                      id="expectedDealSize"
                      type="number"
                      min={0}
                      step="0.01"
                      value={values.expectedDealSize}
                      onChange={(event) => {
                        updateField('expectedDealSize', event.target.value);
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormField>
                </section>

                <section className="space-y-4">
                  <SectionTitle className="text-base">Qualification</SectionTitle>

                  {(
                    [
                      ['need', 'Need'],
                      ['authority', 'Authority'],
                      ['budgetNotes', 'Budget notes'],
                      ['timeline', 'Timeline'],
                      ['painPoints', 'Pain points'],
                      ['decisionMaker', 'Decision maker'],
                      ['competitor', 'Competitor'],
                      ['qualificationNotes', 'Qualification notes'],
                      ['notes', 'Notes'],
                    ] as const
                  ).map(([field, label]) => (
                    <FormField key={field} label={label} htmlFor={field}>
                      <textarea
                        id={field}
                        value={values[field]}
                        onChange={(event) => {
                          updateField(field, event.target.value);
                        }}
                        rows={field === 'notes' || field === 'qualificationNotes' ? 3 : 2}
                        disabled={isFormDisabled}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </FormField>
                  ))}
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
                <Button
                  type="submit"
                  disabled={isFormDisabled || (isEditMode && !isDirty)}
                  className="gap-2"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {isEditMode ? 'Save Changes' : 'Create Lead'}
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
