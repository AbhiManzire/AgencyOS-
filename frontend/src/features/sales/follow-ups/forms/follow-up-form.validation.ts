import type {
  CreateFollowUpPayload,
  UpdateFollowUpPayload,
} from '@/features/sales/follow-ups/api/follow-up.types';
import type {
  FollowUpFormErrors,
  FollowUpFormValues,
  FollowUpListItem,
  FollowUpStatus,
  FollowUpType,
} from '@/features/sales/follow-ups/types';

export const DEFAULT_FOLLOW_UP_FORM_VALUES: FollowUpFormValues = {
  subject: '',
  type: 'CALL',
  scheduledAt: '',
  notes: '',
  reminderAt: '',
  outcome: '',
  nextFollowUpAt: '',
  status: 'PENDING',
};

const FOLLOW_UP_TYPES: readonly FollowUpType[] = [
  'CALL',
  'MEETING',
  'EMAIL',
  'WHATSAPP',
  'REMINDER',
];
const FOLLOW_UP_STATUSES: readonly FollowUpStatus[] = ['PENDING', 'COMPLETED', 'CANCELLED'];

export const FOLLOW_UP_TYPE_LABELS: Record<FollowUpType, string> = {
  CALL: 'Call',
  MEETING: 'Meeting',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  REMINDER: 'Reminder',
};

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Converts an ISO timestamp to a datetime-local input value. */
export function toDatetimeLocalValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Converts a datetime-local input value to an ISO timestamp. */
export function fromDatetimeLocalValue(value: string): string | null {
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

export function followUpToFormValues(followUp: FollowUpListItem): FollowUpFormValues {
  return {
    subject: followUp.subject,
    type: followUp.type,
    scheduledAt: toDatetimeLocalValue(followUp.scheduledAt),
    notes: followUp.notes ?? '',
    reminderAt: toDatetimeLocalValue(followUp.reminderAt),
    outcome: followUp.outcome ?? '',
    nextFollowUpAt: toDatetimeLocalValue(followUp.nextFollowUpAt),
    status: followUp.status,
  };
}

export function areFollowUpFormValuesEqual(
  left: FollowUpFormValues,
  right: FollowUpFormValues,
): boolean {
  return (
    left.subject === right.subject &&
    left.type === right.type &&
    left.scheduledAt === right.scheduledAt &&
    left.notes === right.notes &&
    left.reminderAt === right.reminderAt &&
    left.outcome === right.outcome &&
    left.nextFollowUpAt === right.nextFollowUpAt &&
    left.status === right.status
  );
}

export function validateFollowUpForm(values: FollowUpFormValues): FollowUpFormErrors {
  const errors: FollowUpFormErrors = {};

  if (values.subject.trim().length === 0) {
    errors.subject = 'Subject is required';
  } else if (values.subject.trim().length > 255) {
    errors.subject = 'Subject must be 255 characters or fewer';
  }

  if (!FOLLOW_UP_TYPES.includes(values.type)) {
    errors.type = 'Select a valid follow-up type';
  }

  if (fromDatetimeLocalValue(values.scheduledAt) === null) {
    errors.scheduledAt = 'Date and time is required';
  }

  if (!FOLLOW_UP_STATUSES.includes(values.status)) {
    errors.form = 'Select a valid status';
  }

  return errors;
}

export function toCreateFollowUpPayload(
  values: FollowUpFormValues,
  ownerUserId: string | null,
): CreateFollowUpPayload {
  const scheduledAt = fromDatetimeLocalValue(values.scheduledAt);
  if (scheduledAt === null) {
    throw new Error('Scheduled date is required');
  }

  return {
    subject: values.subject.trim(),
    type: values.type,
    scheduledAt,
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
    reminderAt: fromDatetimeLocalValue(values.reminderAt),
    outcome: values.outcome.trim().length > 0 ? values.outcome.trim() : null,
    nextFollowUpAt: fromDatetimeLocalValue(values.nextFollowUpAt),
    ownerUserId,
    status: values.status,
  };
}

export function toUpdateFollowUpPayload(values: FollowUpFormValues): UpdateFollowUpPayload {
  const scheduledAt = fromDatetimeLocalValue(values.scheduledAt);
  if (scheduledAt === null) {
    throw new Error('Scheduled date is required');
  }

  return {
    subject: values.subject.trim(),
    type: values.type,
    scheduledAt,
    notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
    reminderAt: fromDatetimeLocalValue(values.reminderAt),
    outcome: values.outcome.trim().length > 0 ? values.outcome.trim() : null,
    nextFollowUpAt: fromDatetimeLocalValue(values.nextFollowUpAt),
    status: values.status,
  };
}

export function formatFollowUpDateTime(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
