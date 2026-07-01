import type {
  CreateInvoicePayload,
  InvoiceRecord,
  UpdateInvoicePayload,
} from '@/features/finance/invoices/api/invoice.types';
import type { InvoiceFormErrors, InvoiceFormValues } from '@/features/finance/invoices/types';

export const INVOICE_STATUS_LABELS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  VOID: 'Void',
} as const;

function toDateInputValue(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export const DEFAULT_INVOICE_FORM_VALUES: InvoiceFormValues = {
  clientId: '',
  projectId: '',
  quoteId: '',
  issueDate: toDateInputValue(new Date()),
  dueDate: toDateInputValue(addDays(new Date(), 30)),
  currency: 'USD',
  notes: '',
  status: 'DRAFT',
};

export function areInvoiceFormValuesEqual(
  left: InvoiceFormValues,
  right: InvoiceFormValues,
): boolean {
  return (
    left.clientId === right.clientId &&
    left.projectId === right.projectId &&
    left.quoteId === right.quoteId &&
    left.issueDate === right.issueDate &&
    left.dueDate === right.dueDate &&
    left.currency === right.currency &&
    left.notes === right.notes &&
    left.status === right.status
  );
}

export function validateInvoiceForm(values: InvoiceFormValues): InvoiceFormErrors {
  const errors: InvoiceFormErrors = {};

  if (values.clientId.trim().length === 0) {
    errors.clientId = 'Client is required';
  }

  if (values.projectId.trim().length === 0) {
    errors.projectId = 'Project is required';
  }

  if (values.issueDate.trim().length === 0) {
    errors.issueDate = 'Issue date is required';
  }

  if (values.dueDate.trim().length === 0) {
    errors.dueDate = 'Due date is required';
  }

  if (
    values.issueDate.trim().length > 0 &&
    values.dueDate.trim().length > 0 &&
    values.dueDate < values.issueDate
  ) {
    errors.dueDate = 'Due date cannot be before issue date';
  }

  return errors;
}

export function invoiceRecordToFormValues(record: InvoiceRecord): InvoiceFormValues {
  return {
    clientId: record.clientId,
    projectId: record.projectId,
    quoteId: record.quoteId ?? '',
    issueDate: record.issueDate.slice(0, 10),
    dueDate: record.dueDate.slice(0, 10),
    currency: record.currency,
    notes: record.notes ?? '',
    status: record.status,
  };
}

export function toCreateInvoicePayload(values: InvoiceFormValues): CreateInvoicePayload {
  return {
    clientId: values.clientId,
    projectId: values.projectId,
    quoteId: values.quoteId.trim().length > 0 ? values.quoteId : null,
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    currency: values.currency,
    status: values.status,
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
  };
}

export function toUpdateInvoicePayload(values: InvoiceFormValues): UpdateInvoicePayload {
  return {
    clientId: values.clientId,
    projectId: values.projectId,
    quoteId: values.quoteId.trim().length > 0 ? values.quoteId : null,
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    currency: values.currency,
    status: values.status,
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
  };
}

export function formatInvoiceDate(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function formatInvoiceAmount(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
