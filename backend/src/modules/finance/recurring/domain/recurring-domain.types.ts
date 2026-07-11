import type { RecurringFrequency } from '@prisma/client';

export interface CreateRecurringValidationInput {
  readonly frequency: RecurringFrequency;
  readonly nextRunAt: Date;
  readonly template: Record<string, unknown>;
}
