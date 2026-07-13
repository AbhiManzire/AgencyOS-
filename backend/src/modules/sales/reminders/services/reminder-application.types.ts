import type { Prisma, ReminderRecurrence, ReminderStatus } from '@prisma/client';
import type {
  ListRemindersResult,
  ReminderRecord,
  ReminderScope,
} from '../repositories/reminder.repository.interface';

export interface ReminderApplicationContext {
  readonly actorUserId: string;
}

export interface CreateReminderCommand {
  readonly title: string;
  readonly body?: string | null;
  readonly remindDate: string;
  readonly remindTime: string;
  readonly recurrence?: ReminderRecurrence;
  readonly assignedUserId: string;
  readonly notificationEventKey: string;
  readonly entityType?: string | null;
  readonly entityId?: string | null;
  readonly metadata?: Record<string, unknown> | null;
}

export interface UpdateReminderCommand {
  readonly title?: string;
  readonly body?: string | null;
  readonly remindDate?: string;
  readonly remindTime?: string;
  readonly recurrence?: ReminderRecurrence;
  readonly assignedUserId?: string;
  readonly notificationEventKey?: string;
  readonly entityType?: string | null;
  readonly entityId?: string | null;
  readonly status?: ReminderStatus;
  readonly metadata?: Record<string, unknown> | null;
}

export interface ListRemindersQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly status?: ReminderStatus;
  readonly assignedUserId?: string;
  readonly entityType?: string;
  readonly entityId?: string;
}

export type { ListRemindersResult, Prisma, ReminderRecord, ReminderScope };
