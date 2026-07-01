import type {
  CreateQuotePayload,
  QuoteRecord,
  UpdateQuotePayload,
} from '@/features/sales/quotes/api/quote.types';
import type { QuoteFormValues, QuoteStatus } from '@/features/sales/quotes/types';

export interface QuoteFormErrors {
  dealId?: string;
  clientId?: string;
  title?: string;
  totalAmount?: string;
  form?: string;
}

export const DEFAULT_QUOTE_FORM_VALUES: QuoteFormValues = {
  dealId: '',
  clientId: '',
  title: '',
  validUntil: '',
  currency: 'USD',
  totalAmount: '',
  notes: '',
  status: 'DRAFT',
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  EXPIRED: 'Expired',
};

export function validateQuoteForm(values: QuoteFormValues): QuoteFormErrors {
  const errors: QuoteFormErrors = {};

  if (values.dealId.trim().length === 0) {
    errors.dealId = 'Deal is required';
  }

  if (values.clientId.trim().length === 0) {
    errors.clientId = 'Client is required';
  }

  const title = values.title.trim();
  if (title.length === 0) {
    errors.title = 'Title is required';
  } else if (title.length > 255) {
    errors.title = 'Title must be 255 characters or fewer';
  }

  const amountText = values.totalAmount.trim();
  if (amountText.length === 0) {
    errors.totalAmount = 'Total amount is required';
  } else {
    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount < 0) {
      errors.totalAmount = 'Enter a valid non-negative amount';
    }
  }

  return errors;
}

export function areQuoteFormValuesEqual(left: QuoteFormValues, right: QuoteFormValues): boolean {
  return (
    left.dealId === right.dealId &&
    left.clientId === right.clientId &&
    left.title === right.title &&
    left.validUntil === right.validUntil &&
    left.currency === right.currency &&
    left.totalAmount === right.totalAmount &&
    left.notes === right.notes &&
    left.status === right.status
  );
}

/** Maps a quote record to editable form values. */
export function quoteRecordToFormValues(record: QuoteRecord): QuoteFormValues {
  return {
    dealId: record.dealId,
    clientId: record.clientId,
    title: record.title,
    validUntil: record.validUntil !== null ? record.validUntil.slice(0, 10) : '',
    currency: record.currency,
    totalAmount: String(record.totalAmount),
    notes: record.notes ?? '',
    status: record.status,
  };
}

/** Maps validated form values to update quote API payload. */
export function toUpdateQuotePayload(values: QuoteFormValues): UpdateQuotePayload {
  return {
    dealId: values.dealId,
    clientId: values.clientId,
    title: values.title.trim(),
    status: values.status,
    validUntil: values.validUntil.trim().length > 0 ? values.validUntil : null,
    currency: values.currency,
    totalAmount: Number(values.totalAmount.trim()),
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
  };
}

export function toCreateQuotePayload(values: QuoteFormValues): CreateQuotePayload {
  return {
    dealId: values.dealId,
    clientId: values.clientId,
    title: values.title.trim(),
    status: values.status,
    validUntil: values.validUntil.trim().length > 0 ? values.validUntil : null,
    currency: values.currency,
    totalAmount: Number(values.totalAmount.trim()),
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
  };
}

export function formatQuoteDate(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function formatQuoteAmount(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
