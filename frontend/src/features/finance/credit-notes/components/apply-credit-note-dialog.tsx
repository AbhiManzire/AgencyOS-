'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionTitle, useToast } from '@/design-system';
import { CardTitle } from '@/design-system/typography';
import {
  formatCreditNoteAmount,
  validateApplyCreditNoteForm,
} from '@/features/finance/credit-notes/forms/credit-note-form.validation';
import { useApplyCreditNote } from '@/features/finance/credit-notes/hooks/use-apply-credit-note';
import type {
  ApplyCreditNoteFormErrors,
  ApplyCreditNoteFormValues,
  CreditNoteListItem,
} from '@/features/finance/credit-notes/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface ApplyCreditNoteDialogProps {
  readonly open: boolean;
  readonly note: CreditNoteListItem | null;
  readonly onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: ApplyCreditNoteFormValues = {
  invoiceId: '',
  amount: '',
};

export function ApplyCreditNoteDialog({ open, note, onOpenChange }: ApplyCreditNoteDialogProps) {
  const { showToast } = useToast();
  const { mutateAsync: applyNote, isPending } = useApplyCreditNote();
  const [values, setValues] = useState<ApplyCreditNoteFormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<ApplyCreditNoteFormErrors>({});

  useEffect(() => {
    if (!open || note === null) {
      return;
    }

    setValues({
      invoiceId: note.invoiceId ?? '',
      amount: note.remainingAmount > 0 ? note.remainingAmount.toFixed(2) : '',
    });
    setErrors({});
  }, [note, open]);

  if (!open || note === null) {
    return null;
  }

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const nextErrors = validateApplyCreditNoteForm(values, note.remainingAmount);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      await applyNote({
        id: note.id,
        payload: {
          invoiceId: values.invoiceId.trim(),
          amount: Number(values.amount.trim()),
        },
      });
      showToast('Credit note applied', 'success');
      onOpenChange(false);
    } catch (error) {
      setErrors({ form: extractApiErrorMessage(error) });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-credit-note-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <SectionTitle id="apply-credit-note-title" className="mb-1 text-base">
          Apply credit note
        </SectionTitle>
        <CardTitle className="mb-4 font-normal text-muted-foreground">
          {note.creditNoteNumber} · Remaining{' '}
          {formatCreditNoteAmount(note.remainingAmount, note.currency)}
        </CardTitle>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          {errors.form ? <p className="text-sm text-danger">{errors.form}</p> : null}

          <div className="space-y-2">
            <label htmlFor="apply-credit-note-invoice-id" className="text-sm font-medium">
              Invoice ID
            </label>
            <Input
              id="apply-credit-note-invoice-id"
              value={values.invoiceId}
              disabled={isPending}
              placeholder="UUID"
              onChange={(event) => {
                setValues((current) => ({ ...current, invoiceId: event.target.value }));
                setErrors((current) => ({ ...current, invoiceId: undefined, form: undefined }));
              }}
            />
            {errors.invoiceId ? <p className="text-sm text-danger">{errors.invoiceId}</p> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="apply-credit-note-amount" className="text-sm font-medium">
              Amount
            </label>
            <Input
              id="apply-credit-note-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={values.amount}
              disabled={isPending}
              onChange={(event) => {
                setValues((current) => ({ ...current, amount: event.target.value }));
                setErrors((current) => ({ ...current, amount: undefined, form: undefined }));
              }}
            />
            {errors.amount ? <p className="text-sm text-danger">{errors.amount}</p> : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Apply
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
