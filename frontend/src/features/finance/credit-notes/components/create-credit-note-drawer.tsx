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
  areCreditNoteFormValuesEqual,
  CREDIT_NOTE_STATUS_LABELS,
  DEFAULT_CREDIT_NOTE_FORM_VALUES,
  toCreateCreditNotePayload,
  validateCreditNoteForm,
} from '@/features/finance/credit-notes/forms/credit-note-form.validation';
import { useCreateCreditNote } from '@/features/finance/credit-notes/hooks/use-create-credit-note';
import type {
  CreditNoteFormErrors,
  CreditNoteFormValues,
  CreditNoteStatus,
} from '@/features/finance/credit-notes/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface CreateCreditNoteDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function CreateCreditNoteDrawer({ open, onOpenChange }: CreateCreditNoteDrawerProps) {
  const { showToast } = useToast();
  const { mutateAsync: createNote, isPending: isCreating } = useCreateCreditNote();

  const [values, setValues] = useState<CreditNoteFormValues>(DEFAULT_CREDIT_NOTE_FORM_VALUES);
  const [initialValues, setInitialValues] = useState<CreditNoteFormValues>(
    DEFAULT_CREDIT_NOTE_FORM_VALUES,
  );
  const [errors, setErrors] = useState<CreditNoteFormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const {
    data: clientsData,
    isLoading: isLoadingClients,
    error: clientsError,
    refetch: refetchClients,
  } = useClients({ take: 100 }, { enabled: open });

  const isDirty = useMemo(
    () => !areCreditNoteFormValuesEqual(values, initialValues),
    [initialValues, values],
  );

  useEffect(() => {
    if (!open) {
      setShowDiscardConfirm(false);
      return;
    }

    setValues(DEFAULT_CREDIT_NOTE_FORM_VALUES);
    setInitialValues(DEFAULT_CREDIT_NOTE_FORM_VALUES);
    setErrors({});
  }, [open]);

  const updateField = <K extends keyof CreditNoteFormValues>(
    field: K,
    value: CreditNoteFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const handleCloseRequest = (nextOpen: boolean): void => {
    if (!nextOpen && isDirty && !isCreating) {
      setShowDiscardConfirm(true);
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const nextErrors = validateCreditNoteForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      await createNote(toCreateCreditNotePayload(values));
      showToast('Credit note created', 'success');
      onOpenChange(false);
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    }
  };

  const clientsErrorMessage = clientsError ? extractApiErrorMessage(clientsError) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleCloseRequest}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <form className="flex h-full flex-col" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-6 pb-6">
              <SectionTitle>Create Credit Note</SectionTitle>

              {errors.form ? <p className="text-sm text-danger">{errors.form}</p> : null}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="credit-note-client" className="text-sm font-medium">
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
                      id="credit-note-client"
                      value={values.clientId}
                      disabled={isCreating}
                      onChange={(event) => {
                        updateField('clientId', event.target.value);
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
                  <label htmlFor="credit-note-number" className="text-sm font-medium">
                    Credit note number
                  </label>
                  <Input
                    id="credit-note-number"
                    value={values.creditNoteNumber}
                    disabled={isCreating}
                    onChange={(event) => {
                      updateField('creditNoteNumber', event.target.value);
                    }}
                  />
                  {errors.creditNoteNumber ? (
                    <p className="text-sm text-danger">{errors.creditNoteNumber}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="credit-note-invoice-id" className="text-sm font-medium">
                    Invoice ID (optional)
                  </label>
                  <Input
                    id="credit-note-invoice-id"
                    value={values.invoiceId}
                    disabled={isCreating}
                    placeholder="UUID"
                    onChange={(event) => {
                      updateField('invoiceId', event.target.value);
                    }}
                  />
                  {errors.invoiceId ? (
                    <p className="text-sm text-danger">{errors.invoiceId}</p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="credit-note-issue-date" className="text-sm font-medium">
                      Issue Date
                    </label>
                    <Input
                      id="credit-note-issue-date"
                      type="date"
                      value={values.issueDate}
                      disabled={isCreating}
                      onChange={(event) => {
                        updateField('issueDate', event.target.value);
                      }}
                    />
                    {errors.issueDate ? (
                      <p className="text-sm text-danger">{errors.issueDate}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="credit-note-status" className="text-sm font-medium">
                      Status
                    </label>
                    <NativeSelect
                      id="credit-note-status"
                      value={values.status}
                      disabled={isCreating}
                      onChange={(event) => {
                        updateField('status', event.target.value as CreditNoteStatus);
                      }}
                    >
                      {(Object.keys(CREDIT_NOTE_STATUS_LABELS) as CreditNoteStatus[]).map(
                        (status) => (
                          <option key={status} value={status}>
                            {CREDIT_NOTE_STATUS_LABELS[status]}
                          </option>
                        ),
                      )}
                    </NativeSelect>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="credit-note-amount" className="text-sm font-medium">
                      Amount
                    </label>
                    <Input
                      id="credit-note-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={values.amount}
                      disabled={isCreating}
                      onChange={(event) => {
                        updateField('amount', event.target.value);
                      }}
                    />
                    {errors.amount ? <p className="text-sm text-danger">{errors.amount}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="credit-note-tax-amount" className="text-sm font-medium">
                      Tax amount
                    </label>
                    <Input
                      id="credit-note-tax-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={values.taxAmount}
                      disabled={isCreating}
                      onChange={(event) => {
                        updateField('taxAmount', event.target.value);
                      }}
                    />
                    {errors.taxAmount ? (
                      <p className="text-sm text-danger">{errors.taxAmount}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="credit-note-currency" className="text-sm font-medium">
                    Currency
                  </label>
                  <Input
                    id="credit-note-currency"
                    value={values.currency}
                    maxLength={3}
                    disabled={isCreating}
                    onChange={(event) => {
                      updateField('currency', event.target.value.toUpperCase());
                    }}
                  />
                  {errors.currency ? (
                    <p className="text-sm text-danger">{errors.currency}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="credit-note-notes" className="text-sm font-medium">
                    Notes
                  </label>
                  <Input
                    id="credit-note-notes"
                    value={values.notes}
                    disabled={isCreating}
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
                disabled={isCreating}
                onClick={() => {
                  handleCloseRequest(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="gap-2">
                {isCreating ? <Loader2 className="size-4 animate-spin" /> : null}
                Create Credit Note
              </Button>
            </div>
          </form>
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
