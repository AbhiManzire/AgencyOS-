import type { ApprovalStatus, Prisma } from '@prisma/client';

export const EXPENSE_REPOSITORY = Symbol('EXPENSE_REPOSITORY');

export interface ExpenseScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export type ExpenseTransactionClient = Prisma.TransactionClient;

export type ExpenseListSortField = 'updatedAt' | 'createdAt' | 'expenseDate' | 'amount';

export interface ExpenseRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly vendorId: string | null;
  readonly category: string;
  readonly departmentId: string | null;
  readonly employeeUserId: string | null;
  readonly amount: number;
  readonly taxAmount: number | null;
  readonly currency: string;
  readonly expenseDate: Date;
  readonly description: string | null;
  readonly approvalStatus: ApprovalStatus;
  readonly attachmentFileId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateExpenseData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly vendorId?: string | null;
  readonly category: string;
  readonly departmentId?: string | null;
  readonly employeeUserId?: string | null;
  readonly amount: number;
  readonly taxAmount?: number | null;
  readonly currency: string;
  readonly expenseDate: Date;
  readonly description?: string | null;
  readonly approvalStatus?: ApprovalStatus;
  readonly attachmentFileId?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateExpenseData {
  readonly vendorId?: string | null;
  readonly category?: string;
  readonly departmentId?: string | null;
  readonly employeeUserId?: string | null;
  readonly amount?: number;
  readonly taxAmount?: number | null;
  readonly currency?: string;
  readonly expenseDate?: Date;
  readonly description?: string | null;
  readonly approvalStatus?: ApprovalStatus;
  readonly attachmentFileId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ArchiveExpenseData {
  readonly deletedAt: Date;
  readonly deletedByUserId: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface FindExpenseByIdOptions {
  readonly includeArchived?: boolean;
}

export interface ListExpensesParams {
  readonly scope: ExpenseScope;
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

export interface ListExpensesResult {
  readonly items: readonly ExpenseRecord[];
  readonly total: number;
}

export interface ExpenseRepository {
  create(data: CreateExpenseData, tx?: ExpenseTransactionClient): Promise<ExpenseRecord>;
  update(
    scope: ExpenseScope,
    id: string,
    data: UpdateExpenseData,
    tx?: ExpenseTransactionClient,
  ): Promise<ExpenseRecord | null>;
  archive(
    scope: ExpenseScope,
    id: string,
    data: ArchiveExpenseData,
    tx?: ExpenseTransactionClient,
  ): Promise<ExpenseRecord | null>;
  findById(
    scope: ExpenseScope,
    id: string,
    options?: FindExpenseByIdOptions,
  ): Promise<ExpenseRecord | null>;
  list(params: ListExpensesParams): Promise<ListExpensesResult>;
}
