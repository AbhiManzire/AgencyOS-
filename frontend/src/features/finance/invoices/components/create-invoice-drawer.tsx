'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import { UnsavedChangesDialog } from '@/features/clients/components/unsaved-changes-dialog';
import { useClients } from '@/features/clients/hooks/use-clients';
import {
  areInvoiceFormValuesEqual,
  DEFAULT_INVOICE_FORM_VALUES,
  INVOICE_STATUS_LABELS,
  invoiceRecordToFormValues,
  toCreateInvoicePayload,
  toUpdateInvoicePayload,
  validateInvoiceForm,
} from '@/features/finance/invoices/forms/invoice-form.validation';
import { useCreateInvoice } from '@/features/finance/invoices/hooks/use-create-invoice';
import { useInvoice } from '@/features/finance/invoices/hooks/use-invoice';
import { useUpdateInvoice } from '@/features/finance/invoices/hooks/use-update-invoice';
import type {
  InvoiceFormErrors,
  InvoiceFormValues,
  InvoiceStatus,
} from '@/features/finance/invoices/types';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { useQuotes } from '@/features/sales/quotes/hooks/use-quotes';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export type InvoiceDrawerMode = 'create' | 'edit';

interface CreateInvoiceDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode?: InvoiceDrawerMode;
  readonly invoiceId?: string;
}

export function CreateInvoiceDrawer({
  open,
  onOpenChange,
  mode = 'create',
  invoiceId,
}: CreateInvoiceDrawerProps) {
  const isEditMode = mode === 'edit' && invoiceId !== undefined && invoiceId.length > 0;
  const { showToast } = useToast();
  const { mutateAsync: createInvoice, isPending: isCreating } = useCreateInvoice();
  const { mutateAsync: updateInvoice, isPending: isUpdating } = useUpdateInvoice();
  const {
    data: invoice,
    isLoading: isLoadingInvoice,
    error: loadError,
    refetch: refetchInvoice,
  } = useInvoice(invoiceId ?? '', { enabled: open && isEditMode });

  const [values, setValues] = useState<InvoiceFormValues>(DEFAULT_INVOICE_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<InvoiceFormValues>(
    DEFAULT_INVOICE_FORM_VALUES,
  );
  const [errors, setErrors] = useState<InvoiceFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const {
    data: clientsData,
    isLoading: isLoadingClients,
    error: clientsError,
    refetch: refetchClients,
  } = useClients({ take: 100 }, { enabled: open });

  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjects({ take: 200 }, { enabled: open });

  const {
    data: quotesData,
    isLoading: isLoadingQuotes,
    error: quotesError,
    refetch: refetchQuotes,
  } = useQuotes({ take: 200 }, { enabled: open });

  const isDirty = useMemo(
    () => !areInvoiceFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  const projectOptions = useMemo(() => {
    const projects = projectsData?.items ?? [];
    if (values.clientId.length === 0) {
      return projects;
    }
    return projects.filter((project) => project.clientId === values.clientId);
  }, [projectsData?.items, values.clientId]);

  const quoteOptions = useMemo(() => {
    const quotes = quotesData?.items ?? [];
    if (values.clientId.length === 0) {
      return quotes;
    }
    return quotes.filter((quote) => quote.clientId === values.clientId);
  }, [quotesData?.items, values.clientId]);

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode) {
      return;
    }

    setValues(DEFAULT_INVOICE_FORM_VALUES);
    setInitialValues(DEFAULT_INVOICE_FORM_VALUES);
    setErrors({});
  }, [isEditMode, open]);

  useEffect(() => {
    if (!open || !isEditMode || invoice === undefined) {
      return;
    }

    const formValues = invoiceRecordToFormValues(invoice);
    setValues(formValues);
    setInitialValues(formValues);
    setErrors({});
  }, [invoice, isEditMode, open]);

  useEffect(() => {
    if (values.projectId.length === 0) {
      return;
    }

    const project = projectOptions.find((item) => item.id === values.projectId);
    if (project === undefined) {
      setValues((current) => ({ ...current, projectId: '' }));
    }
  }, [projectOptions, values.projectId]);

  useEffect(() => {
    if (values.quoteId.length === 0) {
      return;
    }

    const quote = quoteOptions.find((item) => item.id === values.quoteId);
    if (quote === undefined) {
      setValues((current) => ({ ...current, quoteId: '' }));
    }
  }, [quoteOptions, values.quoteId]);

  const updateField = <K extends keyof InvoiceFormValues>(
    field: K,
    value: InvoiceFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const isSaving = isCreating || isUpdating;

  const handleCloseRequest = (nextOpen: boolean): void => {
    if (!nextOpen && isDirty && !isSaving) {
      setShowDiscardConfirm(true);
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const nextErrors = validateInvoiceForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      if (isEditMode) {
        await updateInvoice({ id: invoiceId, payload: toUpdateInvoicePayload(values) });
        showToast('Invoice updated', 'success');
      } else {
        await createInvoice(toCreateInvoicePayload(values));
        showToast('Invoice created', 'success');
      }

      onOpenChange(false);
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    }
  };

  const drawerTitle = isEditMode ? 'Edit Invoice' : 'Create Invoice';
  const submitLabel = isEditMode ? 'Save Changes' : 'Create Invoice';
  const isFormDisabled = isSaving || (isEditMode && isLoadingInvoice);

  const clientsErrorMessage = clientsError ? extractApiErrorMessage(clientsError) : null;
  const projectsErrorMessage = projectsError ? extractApiErrorMessage(projectsError) : null;
  const quotesErrorMessage = quotesError ? extractApiErrorMessage(quotesError) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleCloseRequest}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {isEditMode && isLoadingInvoice ? (
            <LoadingState label="Loading invoice..." />
          ) : isEditMode && loadError ? (
            <ErrorState
              message={extractApiErrorMessage(loadError)}
              action={
                <Button variant="outline" onClick={() => void refetchInvoice()}>
                  Try again
                </Button>
              }
            />
          ) : (
            <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-6 pb-6">
                <SectionTitle>{drawerTitle}</SectionTitle>

                {errors.form ? <p className="text-sm text-danger">{errors.form}</p> : null}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="invoice-client" className="text-sm font-medium">
                      Client
                    </label>
                    {isLoadingClients ? (
                      <LoadingState label="Loading clients..." />
                    ) : clientsErrorMessage ? (
                      <ErrorState
                        message={clientsErrorMessage}
                        action={
                          <Button variant="outline" size="sm" onClick={() => void refetchClients()}>
                            Retry
                          </Button>
                        }
                      />
                    ) : (
                      <NativeSelect
                        id="invoice-client"
                        value={values.clientId}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('clientId', event.target.value);
                          updateField('projectId', '');
                          updateField('quoteId', '');
                        }}
                      >
                        <option value="">Select client</option>
                        {(clientsData?.items ?? []).map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.displayName}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                    {errors.clientId ? (
                      <p className="text-sm text-danger">{errors.clientId}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="invoice-project" className="text-sm font-medium">
                      Project
                    </label>
                    {isLoadingProjects ? (
                      <LoadingState label="Loading projects..." />
                    ) : projectsErrorMessage ? (
                      <ErrorState
                        message={projectsErrorMessage}
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void refetchProjects()}
                          >
                            Retry
                          </Button>
                        }
                      />
                    ) : (
                      <NativeSelect
                        id="invoice-project"
                        value={values.projectId}
                        disabled={isFormDisabled || values.clientId.length === 0}
                        onChange={(event) => {
                          updateField('projectId', event.target.value);
                        }}
                      >
                        <option value="">Select project</option>
                        {projectOptions.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                    {errors.projectId ? (
                      <p className="text-sm text-danger">{errors.projectId}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="invoice-quote" className="text-sm font-medium">
                      Quote (optional)
                    </label>
                    {isLoadingQuotes ? (
                      <LoadingState label="Loading quotes..." />
                    ) : quotesErrorMessage ? (
                      <ErrorState
                        message={quotesErrorMessage}
                        action={
                          <Button variant="outline" size="sm" onClick={() => void refetchQuotes()}>
                            Retry
                          </Button>
                        }
                      />
                    ) : (
                      <NativeSelect
                        id="invoice-quote"
                        value={values.quoteId}
                        disabled={isFormDisabled || values.clientId.length === 0}
                        onChange={(event) => {
                          updateField('quoteId', event.target.value);
                        }}
                      >
                        <option value="">No linked quote</option>
                        {quoteOptions.map((quote) => (
                          <option key={quote.id} value={quote.id}>
                            {quote.quoteNumber} — {quote.title}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="invoice-issue-date" className="text-sm font-medium">
                        Issue Date
                      </label>
                      <Input
                        id="invoice-issue-date"
                        type="date"
                        value={values.issueDate}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('issueDate', event.target.value);
                        }}
                      />
                      {errors.issueDate ? (
                        <p className="text-sm text-danger">{errors.issueDate}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="invoice-due-date" className="text-sm font-medium">
                        Due Date
                      </label>
                      <Input
                        id="invoice-due-date"
                        type="date"
                        value={values.dueDate}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('dueDate', event.target.value);
                        }}
                      />
                      {errors.dueDate ? (
                        <p className="text-sm text-danger">{errors.dueDate}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="invoice-currency" className="text-sm font-medium">
                        Currency
                      </label>
                      <Input
                        id="invoice-currency"
                        value={values.currency}
                        maxLength={3}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('currency', event.target.value.toUpperCase());
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="invoice-status" className="text-sm font-medium">
                        Status
                      </label>
                      <NativeSelect
                        id="invoice-status"
                        value={values.status}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('status', event.target.value as InvoiceStatus);
                        }}
                      >
                        {(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map((status) => (
                          <option key={status} value={status}>
                            {INVOICE_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="invoice-notes" className="text-sm font-medium">
                      Notes
                    </label>
                    <Input
                      id="invoice-notes"
                      value={values.notes}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('notes', event.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
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
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                  {submitLabel}
                </Button>
              </div>
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
