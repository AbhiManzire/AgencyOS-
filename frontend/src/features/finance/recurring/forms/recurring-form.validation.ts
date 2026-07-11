import type { CreateRecurringPayload } from '@/features/finance/recurring/api/recurring.types';
import type { RecurringFormErrors, RecurringFormValues } from '@/features/finance/recurring/types';
import type { RecurringFrequency } from '@/features/finance/shared/finance.types';
import { RECURRING_FREQUENCY_LABELS } from '@/features/finance/shared/finance.types';

export { RECURRING_FREQUENCY_LABELS };

export const RECURRING_FREQUENCY_OPTIONS: readonly RecurringFrequency[] = [
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toDatetimeLocalValue(date: Date): string {
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export const DEFAULT_RECURRING_FORM_VALUES: RecurringFormValues = {
  frequency: 'MONTHLY',
  nextRunAt: toDatetimeLocalValue(new Date()),
  isActive: true,
  templateJson: '{}',
  reminderDaysBefore: '',
};

export function areRecurringFormValuesEqual(
  left: RecurringFormValues,
  right: RecurringFormValues,
): boolean {
  return (
    left.frequency === right.frequency &&
    left.nextRunAt === right.nextRunAt &&
    left.isActive === right.isActive &&
    left.templateJson === right.templateJson &&
    left.reminderDaysBefore === right.reminderDaysBefore
  );
}

function parseTemplateJson(
  raw: string,
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: 'Template JSON is required' };
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: 'Template must be a JSON object' };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: 'Template must be valid JSON' };
  }
}

export function validateRecurringForm(values: RecurringFormValues): RecurringFormErrors {
  const errors: RecurringFormErrors = {};

  if (!RECURRING_FREQUENCY_OPTIONS.includes(values.frequency)) {
    errors.frequency = 'Frequency is required';
  }

  if (values.nextRunAt.trim().length === 0) {
    errors.nextRunAt = 'Next run date is required';
  } else if (fromDatetimeLocalValue(values.nextRunAt) === null) {
    errors.nextRunAt = 'Next run date is invalid';
  }

  const templateResult = parseTemplateJson(values.templateJson);
  if (!templateResult.ok) {
    errors.templateJson = templateResult.error;
  }

  const reminderRaw = values.reminderDaysBefore.trim();
  if (reminderRaw.length > 0) {
    const reminder = Number(reminderRaw);
    if (!Number.isInteger(reminder) || reminder < 0) {
      errors.reminderDaysBefore = 'Reminder days must be a non-negative integer';
    }
  }

  return errors;
}

export function toCreateRecurringPayload(values: RecurringFormValues): CreateRecurringPayload {
  const nextRunAt = fromDatetimeLocalValue(values.nextRunAt);
  if (nextRunAt === null) {
    throw new Error('Invalid next run date');
  }

  const templateResult = parseTemplateJson(values.templateJson);
  if (!templateResult.ok) {
    throw new Error(templateResult.error);
  }

  const reminderRaw = values.reminderDaysBefore.trim();
  const reminderDaysBefore = reminderRaw.length === 0 ? null : Number(reminderRaw);

  return {
    frequency: values.frequency,
    nextRunAt,
    isActive: values.isActive,
    template: templateResult.value,
    reminderDaysBefore,
  };
}
