import type {
  CreateExpensePayload,
  ExpenseRecord,
  UpdateExpensePayload,
} from '@/features/finance/expenses/api/expense.types';
import type { ApprovalStatus } from '@/features/finance/shared/finance.types';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';

export interface ExpenseFormValues {
  vendorId: string;
  category: string;
  departmentId: string;
  employeeUserId: string;
  amount: string;
  taxAmount: string;
  currency: string;
  expenseDate: string;
  description: string;
  approvalStatus: ApprovalStatus;
}

export interface ExpenseFormErrors {
  category?: string;
  amount?: string;
  taxAmount?: string;
  currency?: string;
  expenseDate?: string;
  form?: string;
}

function toDateInputValue(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_EXPENSE_FORM_VALUES: ExpenseFormValues = {
  vendorId: '',
  category: '',
  departmentId: '',
  employeeUserId: '',
  amount: '',
  taxAmount: '',
  currency: 'USD',
  expenseDate: toDateInputValue(new Date()),
  description: '',
  approvalStatus: 'PENDING',
};

function optionalTrim(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalTrimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Validates expense form values before submit. */
export function validateExpenseForm(values: ExpenseFormValues): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {};

  if (values.category.trim().length === 0) {
    errors.category = 'Category is required';
  } else if (values.category.trim().length > 120) {
    errors.category = 'Category must be 120 characters or fewer';
  }

  const amountText = values.amount.trim();
  if (amountText.length === 0) {
    errors.amount = 'Amount is required';
  } else {
    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount < 0) {
      errors.amount = 'Enter a valid non-negative amount';
    }
  }

  const taxText = values.taxAmount.trim();
  if (taxText.length > 0) {
    const tax = Number(taxText);
    if (!Number.isFinite(tax) || tax < 0) {
      errors.taxAmount = 'Enter a valid non-negative tax amount';
    }
  }

  if (values.expenseDate.trim().length === 0) {
    errors.expenseDate = 'Expense date is required';
  }

  if (!/^[A-Za-z]{3}$/.test(values.currency.trim())) {
    errors.currency = 'Currency must be a 3-letter ISO code';
  }

  return errors;
}

export function areExpenseFormValuesEqual(
  left: ExpenseFormValues,
  right: ExpenseFormValues,
): boolean {
  return (
    left.vendorId === right.vendorId &&
    left.category === right.category &&
    left.departmentId === right.departmentId &&
    left.employeeUserId === right.employeeUserId &&
    left.amount === right.amount &&
    left.taxAmount === right.taxAmount &&
    left.currency === right.currency &&
    left.expenseDate === right.expenseDate &&
    left.description === right.description &&
    left.approvalStatus === right.approvalStatus
  );
}

export function expenseRecordToFormValues(record: ExpenseRecord): ExpenseFormValues {
  return {
    vendorId: record.vendorId ?? '',
    category: record.category,
    departmentId: record.departmentId ?? '',
    employeeUserId: record.employeeUserId ?? '',
    amount: String(record.amount),
    taxAmount: record.taxAmount !== null ? String(record.taxAmount) : '',
    currency: record.currency,
    expenseDate: record.expenseDate.slice(0, 10),
    description: record.description ?? '',
    approvalStatus: record.approvalStatus,
  };
}

export function toCreateExpensePayload(values: ExpenseFormValues): CreateExpensePayload {
  const taxText = values.taxAmount.trim();

  return {
    vendorId: optionalTrim(values.vendorId),
    category: values.category.trim(),
    departmentId: optionalTrim(values.departmentId),
    employeeUserId: optionalTrim(values.employeeUserId),
    amount: Number(values.amount.trim()),
    taxAmount: taxText.length > 0 ? Number(taxText) : null,
    currency: values.currency.trim().toUpperCase(),
    expenseDate: values.expenseDate,
    description: optionalTrim(values.description),
    approvalStatus: values.approvalStatus,
  };
}

export function toUpdateExpensePayload(values: ExpenseFormValues): UpdateExpensePayload {
  const taxText = values.taxAmount.trim();

  return {
    vendorId: optionalTrimOrNull(values.vendorId),
    category: values.category.trim(),
    departmentId: optionalTrimOrNull(values.departmentId),
    employeeUserId: optionalTrimOrNull(values.employeeUserId),
    amount: Number(values.amount.trim()),
    taxAmount: taxText.length > 0 ? Number(taxText) : null,
    currency: values.currency.trim().toUpperCase(),
    expenseDate: values.expenseDate,
    description: optionalTrimOrNull(values.description),
  };
}

export function formatExpenseDate(value: string | null | undefined): string {
  return formatShortDate(value);
}

export function formatExpenseAmount(value: number, currency = 'USD'): string {
  return formatMoney(value, currency, 2);
}

export function isExpenseArchived(expense: Pick<ExpenseRecord, 'deletedAt'>): boolean {
  return expense.deletedAt !== null;
}
