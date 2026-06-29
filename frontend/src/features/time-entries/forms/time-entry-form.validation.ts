import type { TimeEntryFormValues } from '@/features/time-entries/types';

export const DEFAULT_TIME_ENTRY_FORM_VALUES: TimeEntryFormValues = {
  userId: '',
  startTime: '',
  endTime: '',
  billable: true,
  notes: '',
};

export function validateTimeEntryForm(
  values: TimeEntryFormValues,
): Partial<Record<keyof TimeEntryFormValues, string>> {
  const errors: Partial<Record<keyof TimeEntryFormValues, string>> = {};

  if (values.userId.trim().length === 0) {
    errors.userId = 'User is required.';
  }

  if (values.startTime.trim().length === 0) {
    errors.startTime = 'Start time is required.';
  }

  if (values.endTime.trim().length === 0) {
    errors.endTime = 'End time is required.';
  }

  if (
    values.startTime.trim().length > 0 &&
    values.endTime.trim().length > 0 &&
    new Date(values.endTime).getTime() <= new Date(values.startTime).getTime()
  ) {
    errors.endTime = 'End time must be after start time.';
  }

  return errors;
}

export function areTimeEntryFormValuesEqual(
  a: TimeEntryFormValues,
  b: TimeEntryFormValues,
): boolean {
  return (
    a.userId === b.userId &&
    a.startTime === b.startTime &&
    a.endTime === b.endTime &&
    a.billable === b.billable &&
    a.notes === b.notes
  );
}

export function timeEntryToFormValues(entry: {
  readonly userId: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly billable: boolean;
  readonly notes: string | null;
}): TimeEntryFormValues {
  return {
    userId: entry.userId,
    startTime: toDatetimeLocalValue(entry.startTime),
    endTime: toDatetimeLocalValue(entry.endTime),
    billable: entry.billable,
    notes: entry.notes ?? '',
  };
}

export function toCreateTimeEntryPayload(values: TimeEntryFormValues) {
  return {
    userId: values.userId,
    startTime: fromDatetimeLocalValue(values.startTime),
    endTime: fromDatetimeLocalValue(values.endTime),
    billable: values.billable,
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
  };
}

export function toUpdateTimeEntryPayload(values: TimeEntryFormValues) {
  return {
    userId: values.userId,
    startTime: fromDatetimeLocalValue(values.startTime),
    endTime: fromDatetimeLocalValue(values.endTime),
    billable: values.billable,
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
  };
}

export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number): string => String(value).padStart(2, '0');

  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export function formatDurationMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${String(hours)}h ${String(mins)}m`;
  }

  if (hours > 0) {
    return `${String(hours)}h`;
  }

  return `${String(mins)}m`;
}

export function formatTimeEntryDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
