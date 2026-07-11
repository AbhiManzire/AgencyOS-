import type { ApprovalStatus } from '@prisma/client';
import type { ExpenseRecord, ExpenseScope } from '../repositories/expense.repository.interface';
import { EXPENSE_DOMAIN_ERROR_CODES, ExpenseDomainError } from './expense-domain.errors';
import type {
  CreateExpenseValidationInput,
  UpdateExpenseValidationInput,
} from './expense-domain.types';

const VALID_APPROVAL: readonly ApprovalStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'NOT_REQUIRED',
];

export class ExpenseDomainService {
  validateCreate(input: CreateExpenseValidationInput): void {
    this.assertCategoryRequired(input.category);
    this.assertAmountValid(input.amount);
    if (input.taxAmount !== undefined && input.taxAmount !== null) {
      this.assertTaxAmountValid(input.taxAmount);
    }
    if (input.currency !== undefined) {
      this.assertCurrencyValid(input.currency);
    }
  }

  validateUpdate(expense: ExpenseRecord, input: UpdateExpenseValidationInput): void {
    this.assertExpenseIsActive(expense);
    if (input.category !== undefined) {
      this.assertCategoryRequired(input.category);
    }
    if (input.amount !== undefined) {
      this.assertAmountValid(input.amount);
    }
    if (input.taxAmount !== undefined && input.taxAmount !== null) {
      this.assertTaxAmountValid(input.taxAmount);
    }
    if (input.currency !== undefined) {
      this.assertCurrencyValid(input.currency);
    }
  }

  validateArchive(expense: ExpenseRecord): void {
    this.assertExpenseIsActive(expense);
  }

  validateApprove(expense: ExpenseRecord): void {
    this.assertExpenseIsActive(expense);
    if (expense.approvalStatus === 'APPROVED') {
      throw new ExpenseDomainError(
        EXPENSE_DOMAIN_ERROR_CODES.ALREADY_APPROVED,
        'Expense is already approved.',
      );
    }
  }

  validateReject(expense: ExpenseRecord): void {
    this.assertExpenseIsActive(expense);
    if (expense.approvalStatus === 'REJECTED') {
      throw new ExpenseDomainError(
        EXPENSE_DOMAIN_ERROR_CODES.ALREADY_REJECTED,
        'Expense is already rejected.',
      );
    }
  }

  ensureWorkspaceOwnership(scope: ExpenseScope, expense: ExpenseRecord): void {
    if (expense.tenantId !== scope.tenantId || expense.workspaceId !== scope.workspaceId) {
      throw new ExpenseDomainError(
        EXPENSE_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'Expense does not belong to the requested workspace.',
      );
    }
  }

  normalizeRequiredString(value: string): string {
    return value.trim();
  }

  normalizeOptionalString(value: string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  normalizeCurrency(value: string | undefined): string {
    return (value ?? 'USD').trim().toUpperCase();
  }

  private assertCategoryRequired(category: string): void {
    if (category.trim().length === 0) {
      throw new ExpenseDomainError(
        EXPENSE_DOMAIN_ERROR_CODES.CATEGORY_REQUIRED,
        'Expense category is required.',
      );
    }
  }

  private assertAmountValid(amount: number): void {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new ExpenseDomainError(
        EXPENSE_DOMAIN_ERROR_CODES.INVALID_AMOUNT,
        'Expense amount must be a non-negative number.',
      );
    }
  }

  private assertTaxAmountValid(taxAmount: number): void {
    if (!Number.isFinite(taxAmount) || taxAmount < 0) {
      throw new ExpenseDomainError(
        EXPENSE_DOMAIN_ERROR_CODES.INVALID_TAX_AMOUNT,
        'Tax amount must be a non-negative number.',
      );
    }
  }

  private assertCurrencyValid(currency: string): void {
    if (!/^[A-Z]{3}$/i.test(currency.trim())) {
      throw new ExpenseDomainError(
        EXPENSE_DOMAIN_ERROR_CODES.INVALID_CURRENCY,
        'Currency must be a 3-letter ISO code.',
      );
    }
  }

  private assertExpenseIsActive(expense: ExpenseRecord): void {
    if (expense.deletedAt !== null) {
      throw new ExpenseDomainError(
        EXPENSE_DOMAIN_ERROR_CODES.EXPENSE_ARCHIVED,
        'Expense is archived and cannot be modified.',
      );
    }
  }

  assertValidApprovalStatus(status: ApprovalStatus): void {
    if (!VALID_APPROVAL.includes(status)) {
      throw new ExpenseDomainError(
        EXPENSE_DOMAIN_ERROR_CODES.INVALID_APPROVAL_STATUS,
        'Approval status is invalid.',
      );
    }
  }
}
