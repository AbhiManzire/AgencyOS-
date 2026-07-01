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
  areQuoteFormValuesEqual,
  DEFAULT_QUOTE_FORM_VALUES,
  QUOTE_STATUS_LABELS,
  quoteRecordToFormValues,
  toCreateQuotePayload,
  toUpdateQuotePayload,
  validateQuoteForm,
  type QuoteFormErrors,
} from '@/features/sales/quotes/forms/quote-form.validation';
import { useCreateQuote } from '@/features/sales/quotes/hooks/use-create-quote';
import { useQuote } from '@/features/sales/quotes/hooks/use-quote';
import { useUpdateQuote } from '@/features/sales/quotes/hooks/use-update-quote';
import { useDeals } from '@/features/sales/hooks/use-deals';
import type { QuoteFormValues, QuoteStatus } from '@/features/sales/quotes/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export type QuoteDrawerMode = 'create' | 'edit';

interface CreateQuoteDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode?: QuoteDrawerMode;
  readonly quoteId?: string;
}

export function CreateQuoteDrawer({
  open,
  onOpenChange,
  mode = 'create',
  quoteId,
}: CreateQuoteDrawerProps) {
  const isEditMode = mode === 'edit' && quoteId !== undefined && quoteId.length > 0;
  const { showToast } = useToast();
  const { mutateAsync: createQuote, isPending: isCreating } = useCreateQuote();
  const { mutateAsync: updateQuote, isPending: isUpdating } = useUpdateQuote();
  const {
    data: quote,
    isLoading: isLoadingQuote,
    error: loadError,
    refetch: refetchQuote,
  } = useQuote(quoteId ?? '', { enabled: open && isEditMode });

  const [values, setValues] = useState<QuoteFormValues>(DEFAULT_QUOTE_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<QuoteFormValues>(DEFAULT_QUOTE_FORM_VALUES);
  const [errors, setErrors] = useState<QuoteFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const {
    data: clientsData,
    isLoading: isLoadingClients,
    error: clientsError,
    refetch: refetchClients,
  } = useClients({ take: 100 }, { enabled: open });

  const {
    data: dealsData,
    isLoading: isLoadingDeals,
    error: dealsError,
    refetch: refetchDeals,
  } = useDeals({ take: 200 }, { enabled: open });

  const isDirty = useMemo(
    () => !areQuoteFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  const dealOptions = useMemo(() => dealsData?.items ?? [], [dealsData?.items]);

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isEditMode) {
      return;
    }

    setValues(DEFAULT_QUOTE_FORM_VALUES);
    setInitialValues(DEFAULT_QUOTE_FORM_VALUES);
    setErrors({});
  }, [isEditMode, open]);

  useEffect(() => {
    if (!open || !isEditMode || quote === undefined) {
      return;
    }

    const formValues = quoteRecordToFormValues(quote);
    setValues(formValues);
    setInitialValues(formValues);
    setErrors({});
  }, [isEditMode, open, quote]);

  useEffect(() => {
    if (values.dealId.length === 0) {
      return;
    }

    const deal = dealOptions.find((item) => item.id === values.dealId);
    if (deal !== undefined && deal.clientId !== values.clientId) {
      setValues((current) => ({ ...current, clientId: deal.clientId }));
    }
  }, [dealOptions, values.dealId, values.clientId]);

  const updateField = <K extends keyof QuoteFormValues>(
    field: K,
    value: QuoteFormValues[K],
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

    const nextErrors = validateQuoteForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      if (isEditMode) {
        await updateQuote({ id: quoteId, payload: toUpdateQuotePayload(values) });
        showToast('Quote updated', 'success');
      } else {
        await createQuote(toCreateQuotePayload(values));
        showToast('Quote created', 'success');
      }

      onOpenChange(false);
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    }
  };

  const drawerTitle = isEditMode ? 'Edit Quote' : 'Create Quote';
  const drawerDescription = isEditMode
    ? 'Update quote details and status.'
    : 'Start a new quote for a deal and client.';
  const submitLabel = isEditMode ? 'Save Changes' : 'Create Quote';
  const isFormDisabled = isSaving || (isEditMode && isLoadingQuote);
  const clientsErrorMessage = clientsError ? extractApiErrorMessage(clientsError) : null;
  const dealsErrorMessage = dealsError ? extractApiErrorMessage(dealsError) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleCloseRequest}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <header className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">{drawerTitle}</h2>
            <p className="text-sm text-muted-foreground">{drawerDescription}</p>
          </header>

          {isEditMode && isLoadingQuote ? (
            <LoadingState label="Loading quote..." className="p-6" />
          ) : isEditMode && loadError ? (
            <div className="p-6">
              <ErrorState
                message={extractApiErrorMessage(loadError)}
                action={
                  <Button variant="outline" onClick={() => void refetchQuote()}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : clientsErrorMessage || dealsErrorMessage ? (
            <div className="p-6">
              <ErrorState
                message={clientsErrorMessage ?? dealsErrorMessage ?? 'Unable to load form data.'}
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      void refetchClients();
                      void refetchDeals();
                    }}
                  >
                    Try again
                  </Button>
                }
              />
            </div>
          ) : isLoadingClients || isLoadingDeals ? (
            <LoadingState label="Loading form..." className="p-6" />
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
                  <SectionTitle className="text-base">Quote Details</SectionTitle>

                  <div className="space-y-1.5">
                    <label htmlFor="dealId" className="text-sm font-medium text-foreground">
                      Deal <span className="text-danger">*</span>
                    </label>
                    <NativeSelect
                      id="dealId"
                      label="Deal"
                      value={values.dealId}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('dealId', event.target.value);
                      }}
                    >
                      <option value="">Select deal</option>
                      {dealOptions.map((deal) => (
                        <option key={deal.id} value={deal.id}>
                          {deal.title}
                        </option>
                      ))}
                    </NativeSelect>
                    {errors.dealId ? <p className="text-xs text-danger">{errors.dealId}</p> : null}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="clientId" className="text-sm font-medium text-foreground">
                      Client <span className="text-danger">*</span>
                    </label>
                    <NativeSelect
                      id="clientId"
                      label="Client"
                      value={values.clientId}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('clientId', event.target.value);
                      }}
                    >
                      <option value="">Select client</option>
                      {clientsData?.items.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.displayName}
                        </option>
                      ))}
                    </NativeSelect>
                    {errors.clientId ? (
                      <p className="text-xs text-danger">{errors.clientId}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="title" className="text-sm font-medium text-foreground">
                      Title <span className="text-danger">*</span>
                    </label>
                    <Input
                      id="title"
                      value={values.title}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('title', event.target.value);
                      }}
                      placeholder="Website redesign proposal"
                    />
                    {errors.title ? <p className="text-xs text-danger">{errors.title}</p> : null}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="status" className="text-sm font-medium text-foreground">
                      Status
                    </label>
                    <NativeSelect
                      id="status"
                      label="Status"
                      value={values.status}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('status', event.target.value as QuoteStatus);
                      }}
                    >
                      {(Object.keys(QUOTE_STATUS_LABELS) as QuoteStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {QUOTE_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="totalAmount" className="text-sm font-medium text-foreground">
                        Total Amount <span className="text-danger">*</span>
                      </label>
                      <Input
                        id="totalAmount"
                        type="number"
                        min={0}
                        step="0.01"
                        value={values.totalAmount}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('totalAmount', event.target.value);
                        }}
                      />
                      {errors.totalAmount ? (
                        <p className="text-xs text-danger">{errors.totalAmount}</p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="currency" className="text-sm font-medium text-foreground">
                        Currency
                      </label>
                      <Input
                        id="currency"
                        value={values.currency}
                        maxLength={3}
                        disabled={isFormDisabled}
                        onChange={(event) => {
                          updateField('currency', event.target.value.toUpperCase());
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="validUntil" className="text-sm font-medium text-foreground">
                      Valid Until
                    </label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={values.validUntil}
                      disabled={isFormDisabled}
                      onChange={(event) => {
                        updateField('validUntil', event.target.value);
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="notes" className="text-sm font-medium text-foreground">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      value={values.notes}
                      disabled={isFormDisabled}
                      rows={4}
                      onChange={(event) => {
                        updateField('notes', event.target.value);
                      }}
                      placeholder="Scope summary or terms"
                      className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
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
