import type { RecurringFrequency } from '@prisma/client';
import { RECURRING_DOMAIN_ERROR_CODES, RecurringDomainError } from './recurring-domain.errors';
import type { CreateRecurringValidationInput } from './recurring-domain.types';

const VALID_FREQUENCIES: readonly RecurringFrequency[] = [
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
];

export class RecurringDomainService {
  validateCreate(input: CreateRecurringValidationInput): void {
    if (!VALID_FREQUENCIES.includes(input.frequency)) {
      throw new RecurringDomainError(
        RECURRING_DOMAIN_ERROR_CODES.INVALID_FREQUENCY,
        'Recurring frequency is invalid.',
      );
    }
  }

  advanceNextRunAt(current: Date, frequency: RecurringFrequency): Date {
    const next = new Date(current.getTime());
    switch (frequency) {
      case 'WEEKLY':
        next.setUTCDate(next.getUTCDate() + 7);
        break;
      case 'MONTHLY':
        next.setUTCMonth(next.getUTCMonth() + 1);
        break;
      case 'QUARTERLY':
        next.setUTCMonth(next.getUTCMonth() + 3);
        break;
      case 'YEARLY':
        next.setUTCFullYear(next.getUTCFullYear() + 1);
        break;
      default: {
        const _exhaustive: never = frequency;
        void _exhaustive;
        throw new RecurringDomainError(
          RECURRING_DOMAIN_ERROR_CODES.INVALID_FREQUENCY,
          'Unsupported frequency.',
        );
      }
    }
    return next;
  }

  normalizeOptionalString(value: string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
