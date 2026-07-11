import type { ApprovalStatus } from '@/features/finance/shared/finance.types';

export type ExpenseSortField = 'updatedAt' | 'createdAt' | 'expenseDate' | 'amount';
export type SortDirection = 'asc' | 'desc';

/** Expense row returned by GET /expenses — mirrors backend ExpenseRecord. */
export interface ExpenseRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly vendorId: string | null;
  readonly departmentId: string | null;
  readonly employeeUserId: string | null;
  readonly category: string;
  readonly amount: number;
  readonly taxAmount: number | null;
  readonly currency: string;
  readonly expenseDate: string;
  readonly description: string | null;
  readonly approvalStatus: ApprovalStatus;
  readonly attachmentFileId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListExpensesParams {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly vendorId?: string;
  readonly category?: string;
  readonly approvalStatus?: ApprovalStatus;
  readonly employeeUserId?: string;
  readonly includeArchived?: boolean;
  readonly sortBy?: ExpenseSortField;
  readonly sortOrder?: SortDirection;
}

export interface ListExpensesResult {
  readonly items: readonly ExpenseRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateExpensePayload {
  readonly vendorId?: string;
  readonly category: string;
  readonly departmentId?: string;
  readonly employeeUserId?: string;
  readonly amount: number;
  readonly taxAmount?: number | null;
  readonly currency?: string;
  readonly expenseDate: string;
  readonly description?: string;
  readonly approvalStatus?: ApprovalStatus;
  readonly attachmentFileId?: string;
}

export interface UpdateExpensePayload {
  readonly vendorId?: string | null;
  readonly category?: string;
  readonly departmentId?: string | null;
  readonly employeeUserId?: string | null;
  readonly amount?: number;
  readonly taxAmount?: number | null;
  readonly currency?: string;
  readonly expenseDate?: string;
  readonly description?: string | null;
  readonly attachmentFileId?: string | null;
}
