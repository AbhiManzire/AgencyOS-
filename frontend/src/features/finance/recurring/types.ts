import type { RecurringFrequency } from '@/features/finance/shared/finance.types';

export type { RecurringFrequency };

export interface RecurringFormValues {
  frequency: RecurringFrequency;
  nextRunAt: string;
  isActive: boolean;
  templateJson: string;
  reminderDaysBefore: string;
}

export interface RecurringFormErrors {
  frequency?: string;
  nextRunAt?: string;
  templateJson?: string;
  reminderDaysBefore?: string;
  form?: string;
}
