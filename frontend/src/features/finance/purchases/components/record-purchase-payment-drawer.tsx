'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import type { PaymentMethod } from '@/features/finance/shared/finance.types';
import { PAYMENT_METHOD_LABELS } from '@/features/finance/shared/finance.types';
import { useCreatePurchaseBillPayment } from '@/features/finance/purchases/hooks/use-create-purchase-payment';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface RecordPurchasePaymentDrawerProps {
  readonly open: boolean;
  readonly billId: string;
  readonly currency: string;
  readonly outstandingAmount: number;
  readonly onOpenChange: (open: boolean) => void;
}

interface PaymentFormState {
  amount: string;
  method: PaymentMethod;
  paidAt: string;
  reference: string;
  notes: string;
}

function todayInputValue(): string {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createInitialState(outstandingAmount: number): PaymentFormState {
  return {
    amount: outstandingAmount > 0 ? outstandingAmount.toFixed(2) : '',
    method: 'BANK_TRANSFER',
    paidAt: todayInputValue(),
    reference: '',
    notes: '',
  };
}

export function RecordPurchasePaymentDrawer({
  open,
  billId,
  currency,
  outstandingAmount,
  onOpenChange,
}: RecordPurchasePaymentDrawerProps) {
  const { showToast } = useToast();
  const { mutateAsync: createPayment, isPending } = useCreatePurchaseBillPayment(billId);
  const [values, setValues] = useState<PaymentFormState>(() =>
    createInitialState(outstandingAmount),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(createInitialState(outstandingAmount));
      setError(null);
    }
  }, [open, outstandingAmount]);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid payment amount.');
      return;
    }

    if (amount > outstandingAmount + 0.001) {
      setError(`Amount cannot exceed outstanding ${outstandingAmount.toFixed(2)} ${currency}.`);
      return;
    }

    if (values.reference.trim().length > 255) {
      setError('Reference must be 255 characters or fewer.');
      return;
    }

    if (values.notes.trim().length > 5000) {
      setError('Notes must be 5000 characters or fewer.');
      return;
    }

    try {
      await createPayment({
        amount,
        method: values.method,
        paidAt: new Date(values.paidAt).toISOString(),
        currency,
        reference: values.reference.trim() || null,
        notes: values.notes.trim() || null,
      });
      showToast('Purchase payment recorded');
      onOpenChange(false);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        <div className="space-y-1 border-b border-border pb-4">
          <SectionTitle>Record purchase payment</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Outstanding: {outstandingAmount.toFixed(2)} {currency}
          </p>
        </div>

        <form
          className="flex flex-1 flex-col gap-4 py-4"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <label className="space-y-1 text-sm">
            <span className="font-medium">Amount</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={values.amount}
              onChange={(event) => {
                setValues((current) => ({ ...current, amount: event.target.value }));
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Method</span>
            <select
              value={values.method}
              onChange={(event) => {
                setValues((current) => ({
                  ...current,
                  method: event.target.value as PaymentMethod,
                }));
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3"
            >
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Paid at</span>
            <input
              type="date"
              required
              value={values.paidAt}
              onChange={(event) => {
                setValues((current) => ({ ...current, paidAt: event.target.value }));
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Reference</span>
            <input
              type="text"
              maxLength={255}
              value={values.reference}
              onChange={(event) => {
                setValues((current) => ({ ...current, reference: event.target.value }));
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3"
              placeholder="Check / transaction ID"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Notes</span>
            <textarea
              maxLength={5000}
              value={values.notes}
              onChange={(event) => {
                setValues((current) => ({ ...current, notes: event.target.value }));
              }}
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </label>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || outstandingAmount <= 0}>
              Save payment
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
