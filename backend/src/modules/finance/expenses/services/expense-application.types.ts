import type { ApprovalStatus } from '@prisma/client';
import type {
  ExpenseListSortField,
  ExpenseRecord,
  ExpenseScope,
  ListExpensesResult,
} from '../repositories/expense.repository.interface';

export interface ExpenseApplicationContext {
  readonly actorUserId: string;
}

export interface CreateExpenseCommand {
  readonly vendorId?: string | null;
  readonly category: string;
  readonly departmentId?: string | null;
  readonly employeeUserId?: string | null;
  readonly amount: number;
  readonly taxAmount?: number | null;
  readonly currency?: string;
  readonly expenseDate: Date;
  readonly description?: string | null;
  readonly approvalStatus?: ApprovalStatus;
  readonly attachmentFileId?: string | null;
}

export interface UpdateExpenseCommand {
  readonly vendorId?: string | null;
  readonly category?: string;
  readonly departmentId?: string | null;
  readonly employeeUserId?: string | null;
  readonly amount?: number;
  readonly taxAmount?: number | null;
  readonly currency?: string;
  readonly expenseDate?: Date;
  readonly description?: string | null;
  readonly attachmentFileId?: string | null;
}

export interface ListExpensesQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly vendorId?: string;
  readonly category?: string;
  readonly approvalStatus?: ApprovalStatus;
  readonly employeeUserId?: string;
  readonly includeArchived?: boolean;
  readonly sortBy?: ExpenseListSortField;
  readonly sortOrder?: 'asc' | 'desc';
}

export type { ExpenseRecord, ExpenseScope, ListExpensesResult };
