import type {
  CreateInvoicePayload,
  InvoiceRecord,
  UpdateInvoicePayload,
} from '@/features/finance/invoices/api/invoice.types';
import type { InvoiceFormErrors, InvoiceFormValues } from '@/features/finance/invoices/types';
import { INVOICE_STATUS_LABELS, TAX_MODE_LABELS } from '@/features/finance/shared/finance.types';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';

export { INVOICE_STATUS_LABELS, TAX_MODE_LABELS };

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
  dealId: '',
  issueDate: toDateInputValue(new Date()),
  dueDate: toDateInputValue(addDays(new Date(), 30)),
  currency: 'USD',
  notes: '',
  terms: '',
  taxMode: 'TAX_EXCLUSIVE',
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
    left.dealId === right.dealId &&
    left.issueDate === right.issueDate &&
    left.dueDate === right.dueDate &&
    left.currency === right.currency &&
    left.notes === right.notes &&
    left.terms === right.terms &&
    left.taxMode === right.taxMode &&
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

  if (!/^[A-Za-z]{3}$/.test(values.currency.trim())) {
    errors.currency = 'Currency must be a 3-letter ISO code';
  }

  if (values.dealId.trim().length > 0) {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(values.dealId.trim())) {
      errors.dealId = 'Deal ID must be a valid UUID';
    }
  }

  return errors;
}

export function invoiceRecordToFormValues(record: InvoiceRecord): InvoiceFormValues {
  return {
    clientId: record.clientId,
    projectId: record.projectId,
    quoteId: record.quoteId ?? '',
    dealId: record.dealId ?? '',
    issueDate: record.issueDate.slice(0, 10),
    dueDate: record.dueDate.slice(0, 10),
    currency: record.currency,
    notes: record.notes ?? '',
    terms: record.terms ?? '',
    taxMode: record.taxMode,
    status: record.status,
  };
}

export function toCreateInvoicePayload(values: InvoiceFormValues): CreateInvoicePayload {
  return {
    clientId: values.clientId,
    projectId: values.projectId,
    quoteId: values.quoteId.trim().length > 0 ? values.quoteId : null,
    dealId: values.dealId.trim().length > 0 ? values.dealId.trim() : null,
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    currency: values.currency.trim().toUpperCase(),
    status: values.status,
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
    terms: values.terms.trim().length > 0 ? values.terms.trim() : null,
    taxMode: values.taxMode,
  };
}

export function toUpdateInvoicePayload(values: InvoiceFormValues): UpdateInvoicePayload {
  return {
    clientId: values.clientId,
    projectId: values.projectId,
    quoteId: values.quoteId.trim().length > 0 ? values.quoteId : null,
    dealId: values.dealId.trim().length > 0 ? values.dealId.trim() : null,
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    currency: values.currency.trim().toUpperCase(),
    status: values.status,
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
    terms: values.terms.trim().length > 0 ? values.terms.trim() : null,
    taxMode: values.taxMode,
  };
}

export function formatInvoiceDate(value: string | null | undefined): string {
  return formatShortDate(value);
}

export function formatInvoiceAmount(value: number, currency = 'USD'): string {
  return formatMoney(value, currency, 2);
}
