import type { Prisma, RecurringFrequency } from '@prisma/client';

export const RECURRING_INVOICE_REPOSITORY = Symbol('RECURRING_INVOICE_REPOSITORY');
export const RECURRING_EXPENSE_REPOSITORY = Symbol('RECURRING_EXPENSE_REPOSITORY');

export interface RecurringScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export type RecurringTransactionClient = Prisma.TransactionClient;

export interface RecurringInvoiceRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly frequency: RecurringFrequency;
  readonly nextRunAt: Date;
  readonly lastRunAt: Date | null;
  readonly isActive: boolean;
  readonly template: Record<string, unknown>;
  readonly reminderDaysBefore: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface RecurringExpenseRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly frequency: RecurringFrequency;
  readonly nextRunAt: Date;
  readonly lastRunAt: Date | null;
  readonly isActive: boolean;
  readonly template: Record<string, unknown>;
  readonly reminderDaysBefore: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateRecurringData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly frequency: RecurringFrequency;
  readonly nextRunAt: Date;
  readonly isActive?: boolean;
  readonly template: Record<string, unknown>;
  readonly reminderDaysBefore?: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateRecurringData {
  readonly frequency?: RecurringFrequency;
  readonly nextRunAt?: Date;
  readonly lastRunAt?: Date | null;
  readonly isActive?: boolean;
  readonly template?: Record<string, unknown>;
  readonly reminderDaysBefore?: number | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ArchiveRecurringData {
  readonly deletedAt: Date;
  readonly deletedByUserId: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ListRecurringParams {
  readonly scope: RecurringScope;
  readonly skip?: number;
  readonly take?: number;
  readonly isActive?: boolean;
  readonly includeArchived?: boolean;
}

export interface ListRecurringInvoicesResult {
  readonly items: readonly RecurringInvoiceRecord[];
  readonly total: number;
}

export interface ListRecurringExpensesResult {
  readonly items: readonly RecurringExpenseRecord[];
  readonly total: number;
}

export interface RecurringInvoiceRepository {
  create(
    data: CreateRecurringData,
    tx?: RecurringTransactionClient,
  ): Promise<RecurringInvoiceRecord>;
  update(
    scope: RecurringScope,
    id: string,
    data: UpdateRecurringData,
    tx?: RecurringTransactionClient,
  ): Promise<RecurringInvoiceRecord | null>;
  archive(
    scope: RecurringScope,
    id: string,
    data: ArchiveRecurringData,
    tx?: RecurringTransactionClient,
  ): Promise<RecurringInvoiceRecord | null>;
  findById(scope: RecurringScope, id: string): Promise<RecurringInvoiceRecord | null>;
  list(params: ListRecurringParams): Promise<ListRecurringInvoicesResult>;
  listDue(
    scope: RecurringScope,
    asOf: Date,
    tx?: RecurringTransactionClient,
  ): Promise<readonly RecurringInvoiceRecord[]>;
}

export interface RecurringExpenseRepository {
  create(
    data: CreateRecurringData,
    tx?: RecurringTransactionClient,
  ): Promise<RecurringExpenseRecord>;
  update(
    scope: RecurringScope,
    id: string,
    data: UpdateRecurringData,
    tx?: RecurringTransactionClient,
  ): Promise<RecurringExpenseRecord | null>;
  archive(
    scope: RecurringScope,
    id: string,
    data: ArchiveRecurringData,
    tx?: RecurringTransactionClient,
  ): Promise<RecurringExpenseRecord | null>;
  findById(scope: RecurringScope, id: string): Promise<RecurringExpenseRecord | null>;
  list(params: ListRecurringParams): Promise<ListRecurringExpensesResult>;
  listDue(
    scope: RecurringScope,
    asOf: Date,
    tx?: RecurringTransactionClient,
  ): Promise<readonly RecurringExpenseRecord[]>;
}
