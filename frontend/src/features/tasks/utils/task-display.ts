import type { TaskStatus } from '@/features/tasks/types';

/** Returns a display string for optional task field values. */
export function displayTaskField(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '—';
  }

  return value;
}

/** Formats an ISO date string for display. */
export function formatTaskDate(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

/** Formats estimated hours for display. */
export function formatTaskEstimatedHours(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }

  return `${String(value)}h`;
}

/** Derives completion percentage from task status until subtask tracking exists. */
export function getTaskCompletionPercent(status: TaskStatus): number {
  switch (status) {
    case 'DONE':
      return 100;
    case 'IN_REVIEW':
      return 75;
    case 'IN_PROGRESS':
      return 50;
    case 'CANCELLED':
    case 'TODO':
    default:
      return 0;
  }
}

/** Resolves assignee display label from task record fields. */
export function formatTaskAssignee(
  displayName: string | null | undefined,
  email: string | null | undefined,
  userId: string | null | undefined,
): string {
  if (displayName !== null && displayName !== undefined && displayName.trim().length > 0) {
    return displayName.trim();
  }

  if (email !== null && email !== undefined && email.trim().length > 0) {
    return email.trim();
  }

  if (userId !== null && userId !== undefined && userId.trim().length > 0) {
    return userId;
  }

  return 'Unassigned';
}
