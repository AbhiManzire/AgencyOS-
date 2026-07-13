'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import { useClientContacts } from '@/features/clients/contacts/hooks/use-client-contacts';
import { useWorkspaceOwners } from '@/features/clients/hooks/use-workspace-owners';
import { useClients } from '@/features/clients/hooks/use-clients';
import {
  areDealFormValuesEqual,
  dealRecordToFormValues,
  DEFAULT_DEAL_FORM_VALUES,
  toCreateDealPayload,
  toUpdateDealPayload,
  validateDealForm,
  type DealFormErrors,
  type DealFormValues,
} from '@/features/sales/forms/deal-form.validation';
import { useCreateDeal } from '@/features/sales/hooks/use-create-deal';
import { useDeal } from '@/features/sales/hooks/use-deal';
import { useUpdateDeal } from '@/features/sales/hooks/use-update-deal';
import { useLeads } from '@/features/sales/leads/hooks/use-leads';
import { LEAD_SOURCE_LABELS } from '@/features/sales/leads/utils/lead-display';
import type { LeadSource } from '@/features/sales/leads/types';
import { PIPELINE_COLUMNS } from '@/features/sales/pipeline/pipeline.constants';
import type { DealForecastCategory, DealPriority, DealStage } from '@/features/sales/types';
import {
  DEAL_FORECAST_CATEGORY_LABELS,
  DEAL_PRIORITY_LABELS,
  getDealStageDefaultProbability,
} from '@/features/sales/utils/deal-display';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export type DealDrawerMode = 'create' | 'edit';

export interface DealFormDrawerDefaults {
  readonly clientId?: string;
  readonly contactId?: string;
  readonly leadId?: string;
  readonly title?: string;
  readonly value?: string;
  readonly ownerUserId?: string;
  readonly source?: LeadSource | '';
}

interface DealFormDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode?: DealDrawerMode;
  readonly dealId?: string;
  readonly defaults?: DealFormDrawerDefaults;
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

function buildInitialValues(defaults?: DealFormDrawerDefaults): DealFormValues {
  return {
    ...DEFAULT_DEAL_FORM_VALUES,
    clientId: defaults?.clientId ?? '',
    contactId: defaults?.contactId ?? '',
    leadId: defaults?.leadId ?? '',
    title: defaults?.title ?? '',
    value: defaults?.value ?? '',
    ownerUserId: defaults?.ownerUserId ?? '',
    source: defaults?.source ?? '',
  };
}

const OPEN_STAGES = PIPELINE_COLUMNS.filter(
  (column) => column.stage !== 'WON' && column.stage !== 'LOST',
);

export function DealFormDrawer({
  open,
  onOpenChange,
  mode = 'create',
  dealId,
  defaults,
}: DealFormDrawerProps) {
  const isEditMode = mode === 'edit' && dealId !== undefined && dealId.length > 0;
  const { showToast } = useToast();
  const { mutateAsync: createDeal, isPending: isCreating } = useCreateDeal();
  const { mutateAsync: updateDeal, isPending: isUpdating } = useUpdateDeal();
  const {
    data: deal,
    isLoading: isLoadingDeal,
    error: loadError,
    refetch: refetchDeal,
  } = useDeal(dealId ?? '', { enabled: open && isEditMode });

  const initialCreateValues = useMemo(() => buildInitialValues(defaults), [defaults]);

  const [values, setValues] = useState<DealFormValues>(initialCreateValues);
  const [initialValues, setInitialValues] = useState<DealFormValues>(initialCreateValues);
  const [errors, setErrors] = useState<DealFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const {
    data: clientsData,
    isLoading: isLoadingClients,
    error: clientsError,
    refetch: refetchClients,
  } = useClients({ take: 100 }, { enabled: open });

  const {
    data: contacts = [],
    isLoading: isLoadingContacts,
    error: contactsError,
    refetch: refetchContacts,
  } = useClientContacts(values.clientId);

  const { data: leadsData } = useLeads({ take: 100 }, { enabled: open });
  const { data: owners = [] } = useWorkspaceOwners({ enabled: open });

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode) {
      return;
    }

    const next = buildInitialValues(defaults);
    setValues(next);
    setInitialValues(next);
    setErrors({});
  }, [defaults, isEditMode, open]);

  useEffect(() => {
    if (!open || !isEditMode || deal === undefined) {
      return;
    }

    const formValues = dealRecordToFormValues(deal);
    setValues(formValues);
    setInitialValues(formValues);
    setErrors({});
  }, [deal, isEditMode, open]);

  useEffect(() => {
    if (values.clientId.length === 0) {
      setValues((current) =>
        current.contactId.length === 0 ? current : { ...current, contactId: '' },
      );
    }
  }, [values.clientId]);

  const isDirty = !areDealFormValuesEqual(values, initialValues);
  const isSaving = isCreating || isUpdating;
  const clientsErrorMessage = clientsError ? extractApiErrorMessage(clientsError) : null;
  const contactsErrorMessage = contactsError ? extractApiErrorMessage(contactsError) : null;

  const updateField = <K extends keyof DealFormValues>(
    field: K,
    value: DealFormValues[K],
  ): void => {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === 'stage' && typeof value === 'string') {
        const stage = value as DealStage;
        if (
          current.probability.trim().length === 0 ||
          current.probability === String(getDealStageDefaultProbability(current.stage))
        ) {
          next.probability = String(getDealStageDefaultProbability(stage));
        }
      }
      return next;
    });
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

    const nextErrors = validateDealForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      if (isEditMode) {
        await updateDeal({ id: dealId, payload: toUpdateDealPayload(values) });
        showToast('Deal updated', 'success');
      } else {
        await createDeal(toCreateDealPayload(values));
        showToast('Deal created', 'success');
      }

      onOpenChange(false);
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    }
  };

  const drawerTitle = isEditMode ? 'Edit Deal' : 'Create Deal';
  const drawerDescription = isEditMode
    ? 'Update deal details for this opportunity.'
    : 'Add a new opportunity to the pipeline.';
  const submitLabel = isEditMode ? 'Save Changes' : 'Create Deal';
  const isFormDisabled = isSaving || (isEditMode && isLoadingDeal);
  const stageOptions = isEditMode ? PIPELINE_COLUMNS : OPEN_STAGES;

  return (
    <>
      <Sheet open={open} onOpenChange={handleCloseRequest}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <header className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">{drawerTitle}</h2>
            <p className="text-sm text-muted-foreground">{drawerDescription}</p>
          </header>

          {isEditMode && isLoadingDeal ? (
            <LoadingState label="Loading deal..." className="p-6" />
          ) : isEditMode && loadError ? (
            <div className="p-6">
              <ErrorState
                message={extractApiErrorMessage(loadError)}
                action={
                  <Button variant="outline" onClick={() => void refetchDeal()}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : clientsErrorMessage ? (
            <div className="p-6">
              <ErrorState
                message={clientsErrorMessage}
                action={
                  <Button variant="outline" onClick={() => void refetchClients()}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : isLoadingClients ? (
            <LoadingState label="Loading clients..." className="p-6" />
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
                  <SectionTitle className="text-base">Deal Details</SectionTitle>

                  <FormField label="Title" htmlFor="title" required error={errors.title}>
                    <Input
                      id="title"
                      value={values.title}
                      onChange={(event) => {
                        updateField('title', event.target.value);
                      }}
                      placeholder="Website redesign"
                      disabled={isFormDisabled}
                    />
                  </FormField>

                  <FormField
                    label="Client (Account)"
                    htmlFor="clientId"
                    required
                    error={errors.clientId}
                  >
                    <NativeSelect
                      id="clientId"
                      label="Client"
                      value={values.clientId}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('clientId', event.target.value);
                        updateField('contactId', '');
                      }}
                    >
                      <option value="">Select client</option>
                      {clientsData?.items.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.displayName}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>

                  <FormField label="Contact" htmlFor="contactId">
                    {contactsErrorMessage ? (
                      <ErrorState
                        message={contactsErrorMessage}
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void refetchContacts()}
                          >
                            Retry
                          </Button>
                        }
                      />
                    ) : isLoadingContacts && values.clientId.length > 0 ? (
                      <LoadingState label="Loading contacts..." />
                    ) : (
                      <NativeSelect
                        id="contactId"
                        label="Contact"
                        value={values.contactId}
                        disabled={isFormDisabled || values.clientId.length === 0}
                        onChange={(event) => {
                          updateField('contactId', event.target.value);
                        }}
                      >
                        <option value="">No contact</option>
                        {contacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {[contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
                              contact.email ||
                              contact.id}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  </FormField>

                  <FormField label="Owner" htmlFor="ownerUserId">
                    <NativeSelect
                      id="ownerUserId"
                      label="Owner"
                      value={values.ownerUserId}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('ownerUserId', event.target.value);
                      }}
                    >
                      <option value="">Unassigned</option>
                      {owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.displayName || owner.email}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Value" htmlFor="value" required error={errors.value}>
                      <Input
                        id="value"
                        type="number"
                        min={0}
                        step="0.01"
                        value={values.value}
                        onChange={(event) => {
                          updateField('value', event.target.value);
                        }}
                        placeholder="10000"
                        disabled={isFormDisabled}
                      />
                    </FormField>

                    <FormField label="Currency" htmlFor="currency" error={errors.currency}>
                      <Input
                        id="currency"
                        value={values.currency}
                        maxLength={3}
                        onChange={(event) => {
                          updateField('currency', event.target.value.toUpperCase());
                        }}
                        placeholder="USD"
                        disabled={isFormDisabled}
                      />
                    </FormField>
                  </div>

                  <FormField label="Expected Close" htmlFor="expectedCloseDate">
                    <Input
                      id="expectedCloseDate"
                      type="date"
                      value={values.expectedCloseDate}
                      onChange={(event) => {
                        updateField('expectedCloseDate', event.target.value);
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormField>

                  <FormField label="Stage" htmlFor="stage">
                    <NativeSelect
                      id="stage"
                      label="Stage"
                      value={values.stage}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('stage', event.target.value as DealStage);
                      }}
                    >
                      {stageOptions.map((column) => (
                        <option key={column.id} value={column.stage}>
                          {column.label}
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
                      <option value="">No source</option>
                      {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((key) => (
                        <option key={key} value={key}>
                          {LEAD_SOURCE_LABELS[key]}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Probability (%)"
                      htmlFor="probability"
                      error={errors.probability}
                    >
                      <Input
                        id="probability"
                        type="number"
                        min={0}
                        max={100}
                        value={values.probability}
                        onChange={(event) => {
                          updateField('probability', event.target.value);
                        }}
                        placeholder="50"
                        disabled={isFormDisabled}
                      />
                    </FormField>

                    <FormField label="Forecast Category" htmlFor="forecastCategory">
                      <NativeSelect
                        id="forecastCategory"
                        label="Forecast Category"
                        value={values.forecastCategory}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField(
                            'forecastCategory',
                            event.target.value as DealForecastCategory,
                          );
                        }}
                      >
                        {(Object.keys(DEAL_FORECAST_CATEGORY_LABELS) as DealForecastCategory[]).map(
                          (key) => (
                            <option key={key} value={key}>
                              {DEAL_FORECAST_CATEGORY_LABELS[key]}
                            </option>
                          ),
                        )}
                      </NativeSelect>
                    </FormField>
                  </div>

                  <FormField label="Priority" htmlFor="priority">
                    <NativeSelect
                      id="priority"
                      label="Priority"
                      value={values.priority}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('priority', event.target.value as DealPriority);
                      }}
                    >
                      {(Object.keys(DEAL_PRIORITY_LABELS) as DealPriority[]).map((key) => (
                        <option key={key} value={key}>
                          {DEAL_PRIORITY_LABELS[key]}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>

                  <FormField label="Description" htmlFor="description">
                    <textarea
                      id="description"
                      value={values.description}
                      onChange={(event) => {
                        updateField('description', event.target.value);
                      }}
                      rows={3}
                      placeholder="Opportunity notes"
                      disabled={isFormDisabled}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </FormField>

                  <FormField label="Lead" htmlFor="leadId">
                    <NativeSelect
                      id="leadId"
                      label="Lead"
                      value={values.leadId}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('leadId', event.target.value);
                      }}
                    >
                      <option value="">No linked lead</option>
                      {leadsData?.items.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.company}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>

                  <FormField label="Service" htmlFor="service">
                    <Input
                      id="service"
                      value={values.service}
                      onChange={(event) => {
                        updateField('service', event.target.value);
                      }}
                      placeholder="Website redesign"
                      disabled={isFormDisabled}
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
                <Button
                  type="submit"
                  disabled={isFormDisabled || (isEditMode && !isDirty)}
                  className="gap-2"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {submitLabel}
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
