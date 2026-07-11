import type { RecurringFrequency } from '@prisma/client';
import type {
  ListRecurringExpensesResult,
  ListRecurringInvoicesResult,
  RecurringExpenseRecord,
  RecurringInvoiceRecord,
  RecurringScope,
} from '../repositories/recurring.repository.interface';

export interface RecurringApplicationContext {
  readonly actorUserId: string;
}

export interface CreateRecurringCommand {
  readonly frequency: RecurringFrequency;
  readonly nextRunAt: Date;
  readonly isActive?: boolean;
  readonly template: Record<string, unknown>;
  readonly reminderDaysBefore?: number | null;
}

export interface UpdateRecurringCommand {
  readonly frequency?: RecurringFrequency;
  readonly nextRunAt?: Date;
  readonly isActive?: boolean;
  readonly template?: Record<string, unknown>;
  readonly reminderDaysBefore?: number | null;
}

export interface ListRecurringQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly isActive?: boolean;
  readonly includeArchived?: boolean;
}

export interface RunDueResult {
  readonly invoicesAdvanced: number;
  readonly expensesAdvanced: number;
}

export type {
  RecurringScope,
  RecurringInvoiceRecord,
  RecurringExpenseRecord,
  ListRecurringInvoicesResult,
  ListRecurringExpensesResult,
};
