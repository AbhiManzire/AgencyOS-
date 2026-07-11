import type {
  CreateCreditNotePayload,
  CreditNoteRecord,
} from '@/features/finance/credit-notes/api/credit-note.types';
import type {
  ApplyCreditNoteFormErrors,
  ApplyCreditNoteFormValues,
  CreditNoteFormErrors,
  CreditNoteFormValues,
  CreditNoteListItem,
} from '@/features/finance/credit-notes/types';
import { CREDIT_NOTE_STATUS_LABELS } from '@/features/finance/shared/finance.types';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';

export { CREDIT_NOTE_STATUS_LABELS };

function toDateInputValue(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_CREDIT_NOTE_FORM_VALUES: CreditNoteFormValues = {
  clientId: '',
  invoiceId: '',
  creditNoteNumber: '',
  issueDate: toDateInputValue(new Date()),
  amount: '',
  taxAmount: '',
  currency: 'USD',
  notes: '',
  status: 'DRAFT',
};

export function areCreditNoteFormValuesEqual(
  left: CreditNoteFormValues,
  right: CreditNoteFormValues,
): boolean {
  return (
    left.clientId === right.clientId &&
    left.invoiceId === right.invoiceId &&
    left.creditNoteNumber === right.creditNoteNumber &&
    left.issueDate === right.issueDate &&
    left.amount === right.amount &&
    left.taxAmount === right.taxAmount &&
    left.currency === right.currency &&
    left.notes === right.notes &&
    left.status === right.status
  );
}

export function validateCreditNoteForm(values: CreditNoteFormValues): CreditNoteFormErrors {
  const errors: CreditNoteFormErrors = {};

  if (values.clientId.trim().length === 0) {
    errors.clientId = 'Client is required';
  }

  if (values.creditNoteNumber.trim().length === 0) {
    errors.creditNoteNumber = 'Credit note number is required';
  } else if (values.creditNoteNumber.trim().length > 100) {
    errors.creditNoteNumber = 'Credit note number must be 100 characters or fewer';
  }

  if (values.issueDate.trim().length === 0) {
    errors.issueDate = 'Issue date is required';
  }

  const amount = Number(values.amount.trim());
  if (values.amount.trim().length === 0 || !Number.isFinite(amount) || amount < 0) {
    errors.amount = 'Enter a valid non-negative amount';
  }

  if (values.taxAmount.trim().length > 0) {
    const taxAmount = Number(values.taxAmount.trim());
    if (!Number.isFinite(taxAmount) || taxAmount < 0) {
      errors.taxAmount = 'Enter a valid non-negative tax amount';
    }
  }

  if (!/^[A-Za-z]{3}$/.test(values.currency.trim())) {
    errors.currency = 'Currency must be a 3-letter ISO code';
  }

  if (values.invoiceId.trim().length > 0) {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(values.invoiceId.trim())) {
      errors.invoiceId = 'Invoice ID must be a valid UUID';
    }
  }

  return errors;
}

export function toCreateCreditNotePayload(values: CreditNoteFormValues): CreateCreditNotePayload {
  const taxTrimmed = values.taxAmount.trim();
  return {
    clientId: values.clientId,
    invoiceId: values.invoiceId.trim().length > 0 ? values.invoiceId.trim() : null,
    creditNoteNumber: values.creditNoteNumber.trim(),
    issueDate: values.issueDate,
    amount: Number(values.amount.trim()),
    taxAmount: taxTrimmed.length > 0 ? Number(taxTrimmed) : null,
    currency: values.currency.trim().toUpperCase(),
    status: values.status,
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
  };
}

export function creditNoteRecordToListItem(
  record: CreditNoteRecord,
  clientName = '',
): CreditNoteListItem {
  return {
    id: record.id,
    clientId: record.clientId,
    clientName,
    invoiceId: record.invoiceId,
    creditNoteNumber: record.creditNoteNumber,
    issueDate: record.issueDate,
    amount: record.amount,
    taxAmount: record.taxAmount,
    currency: record.currency,
    status: record.status,
    appliedAmount: record.appliedAmount,
    remainingAmount: Math.max(0, record.amount - record.appliedAmount),
    updatedAt: record.updatedAt,
  };
}

export function validateApplyCreditNoteForm(
  values: ApplyCreditNoteFormValues,
  maxAmount: number,
): ApplyCreditNoteFormErrors {
  const errors: ApplyCreditNoteFormErrors = {};
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (values.invoiceId.trim().length === 0) {
    errors.invoiceId = 'Invoice ID is required';
  } else if (!uuidPattern.test(values.invoiceId.trim())) {
    errors.invoiceId = 'Invoice ID must be a valid UUID';
  }

  const amount = Number(values.amount.trim());
  if (values.amount.trim().length === 0 || !Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Enter a valid amount greater than zero';
  } else if (amount > maxAmount + 0.001) {
    errors.amount = `Amount cannot exceed remaining ${maxAmount.toFixed(2)}`;
  }

  return errors;
}

export function formatCreditNoteDate(value: string | null | undefined): string {
  return formatShortDate(value);
}

export function formatCreditNoteAmount(value: number, currency = 'USD'): string {
  return formatMoney(value, currency, 2);
}
