import type {
  CreatePurchaseBillPayload,
  PurchaseBillRecord,
  UpdatePurchaseBillPayload,
} from '@/features/finance/purchases/api/purchase-bill.types';
import type {
  PurchaseBillFormErrors,
  PurchaseBillFormValues,
} from '@/features/finance/purchases/types';
import { PURCHASE_BILL_STATUS_LABELS } from '@/features/finance/shared/finance.types';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';

export { PURCHASE_BILL_STATUS_LABELS };

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

export const DEFAULT_PURCHASE_BILL_FORM_VALUES: PurchaseBillFormValues = {
  vendorId: '',
  billNumber: '',
  issueDate: toDateInputValue(new Date()),
  dueDate: toDateInputValue(addDays(new Date(), 30)),
  currency: 'USD',
  notes: '',
  status: 'DRAFT',
};

export function arePurchaseBillFormValuesEqual(
  left: PurchaseBillFormValues,
  right: PurchaseBillFormValues,
): boolean {
  return (
    left.vendorId === right.vendorId &&
    left.billNumber === right.billNumber &&
    left.issueDate === right.issueDate &&
    left.dueDate === right.dueDate &&
    left.currency === right.currency &&
    left.notes === right.notes &&
    left.status === right.status
  );
}

export function validatePurchaseBillForm(values: PurchaseBillFormValues): PurchaseBillFormErrors {
  const errors: PurchaseBillFormErrors = {};

  if (values.vendorId.trim().length === 0) {
    errors.vendorId = 'Vendor is required';
  }

  if (values.billNumber.trim().length === 0) {
    errors.billNumber = 'Bill number is required';
  } else if (values.billNumber.trim().length > 100) {
    errors.billNumber = 'Bill number must be 100 characters or fewer';
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

  return errors;
}

export function purchaseBillRecordToFormValues(record: PurchaseBillRecord): PurchaseBillFormValues {
  return {
    vendorId: record.vendorId,
    billNumber: record.billNumber,
    issueDate: record.issueDate.slice(0, 10),
    dueDate: record.dueDate.slice(0, 10),
    currency: record.currency,
    notes: record.notes ?? '',
    status: record.status,
  };
}

export function toCreatePurchaseBillPayload(
  values: PurchaseBillFormValues,
): CreatePurchaseBillPayload {
  return {
    vendorId: values.vendorId,
    billNumber: values.billNumber.trim(),
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    currency: values.currency.trim().toUpperCase(),
    status: values.status,
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
  };
}

export function toUpdatePurchaseBillPayload(
  values: PurchaseBillFormValues,
): UpdatePurchaseBillPayload {
  return {
    vendorId: values.vendorId,
    billNumber: values.billNumber.trim(),
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    currency: values.currency.trim().toUpperCase(),
    status: values.status,
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
  };
}

export function formatPurchaseBillDate(value: string | null | undefined): string {
  return formatShortDate(value);
}

export function formatPurchaseBillAmount(value: number, currency = 'USD'): string {
  return formatMoney(value, currency, 2);
}
