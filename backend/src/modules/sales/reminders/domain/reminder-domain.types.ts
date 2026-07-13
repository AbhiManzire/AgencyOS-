import type { ReminderRecurrence, ReminderStatus } from '@prisma/client';

export const REMIND_TIME_PATTERN = /^\d{2}:\d{2}$/;

export interface CreateReminderValidationInput {
  readonly title: string;
  readonly remindDate: string;
  readonly remindTime: string;
  readonly recurrence?: ReminderRecurrence;
  readonly assignedUserId: string;
  readonly notificationEventKey: string;
  readonly status?: ReminderStatus;
}

export interface UpdateReminderValidationInput {
  readonly title?: string;
  readonly remindDate?: string;
  readonly remindTime?: string;
  readonly recurrence?: ReminderRecurrence;
  readonly assignedUserId?: string;
  readonly notificationEventKey?: string;
  readonly status?: ReminderStatus;
}
