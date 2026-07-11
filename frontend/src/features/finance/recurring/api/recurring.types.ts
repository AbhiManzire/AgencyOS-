import type { RecurringFrequency } from '@/features/finance/shared/finance.types';

export type { RecurringFrequency };

export interface RecurringRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly frequency: RecurringFrequency;
  readonly nextRunAt: string;
  readonly lastRunAt: string | null;
  readonly isActive: boolean;
  readonly template: Record<string, unknown>;
  readonly reminderDaysBefore: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListRecurringParams {
  readonly skip?: number;
  readonly take?: number;
  readonly isActive?: boolean;
  readonly includeArchived?: boolean;
}

export interface ListRecurringResult {
  readonly items: readonly RecurringRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateRecurringPayload {
  readonly frequency: RecurringFrequency;
  readonly nextRunAt: string;
  readonly isActive?: boolean;
  readonly template: Record<string, unknown>;
  readonly reminderDaysBefore?: number | null;
}

export interface UpdateRecurringPayload {
  readonly frequency?: RecurringFrequency;
  readonly nextRunAt?: string;
  readonly isActive?: boolean;
  readonly template?: Record<string, unknown>;
  readonly reminderDaysBefore?: number | null;
}

export interface RunDueResult {
  readonly invoicesAdvanced: number;
  readonly expensesAdvanced: number;
}

export type RecurringKind = 'invoice' | 'expense';
