import type { ReminderRecurrence, ReminderStatus } from '@prisma/client';
import type { ReminderRecord } from '../repositories/reminder.repository.interface';
import { REMINDER_DOMAIN_ERROR_CODES, ReminderDomainError } from './reminder-domain.errors';
import {
  REMIND_TIME_PATTERN,
  type CreateReminderValidationInput,
  type UpdateReminderValidationInput,
} from './reminder-domain.types';

const VALID_RECURRENCES: readonly ReminderRecurrence[] = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'];
const VALID_STATUSES: readonly ReminderStatus[] = ['PENDING', 'SENT', 'CANCELLED', 'COMPLETED'];
const MUTABLE_STATUSES: readonly ReminderStatus[] = ['PENDING', 'SENT', 'COMPLETED'];

export class ReminderDomainService {
  validateCreate(input: CreateReminderValidationInput): void {
    this.assertTitleRequired(input.title);
    this.assertRemindDateValid(input.remindDate);
    this.assertRemindTimeValid(input.remindTime);
    this.assertAssignedUserRequired(input.assignedUserId);
    this.assertNotificationEventKeyRequired(input.notificationEventKey);

    if (input.recurrence !== undefined) {
      this.assertRecurrenceValid(input.recurrence);
    }

    if (input.status !== undefined) {
      this.assertCreatableStatus(input.status);
    }

    this.computeRemindAt(input.remindDate, input.remindTime);
  }

  validateUpdate(reminder: ReminderRecord, input: UpdateReminderValidationInput): void {
    this.assertReminderIsActive(reminder);

    if (input.title !== undefined) {
      this.assertTitleRequired(input.title);
    }

    if (input.remindDate !== undefined) {
      this.assertRemindDateValid(input.remindDate);
    }

    if (input.remindTime !== undefined) {
      this.assertRemindTimeValid(input.remindTime);
    }

    if (input.assignedUserId !== undefined) {
      this.assertAssignedUserRequired(input.assignedUserId);
    }

    if (input.notificationEventKey !== undefined) {
      this.assertNotificationEventKeyRequired(input.notificationEventKey);
    }

    if (input.recurrence !== undefined) {
      this.assertRecurrenceValid(input.recurrence);
    }

    if (input.status !== undefined) {
      this.assertMutableStatus(input.status);
    }

    const remindDate = input.remindDate ?? formatDateOnlyUtc(reminder.remindDate);
    const remindTime = input.remindTime ?? reminder.remindTime;
    this.computeRemindAt(remindDate, remindTime);
  }

  normalizeRequiredString(value: string): string {
    return value.trim();
  }

  normalizeOptionalString(value: string | null | undefined): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  computeRemindAt(remindDate: string, remindTime: string): Date {
    this.assertRemindDateValid(remindDate);
    this.assertRemindTimeValid(remindTime);

    const remindAt = new Date(`${remindDate}T${remindTime}:00.000Z`);
    if (Number.isNaN(remindAt.getTime())) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.INVALID_REMIND_AT,
        'Remind date and time could not be combined into a valid UTC timestamp.',
      );
    }

    return remindAt;
  }

  parseRemindDate(remindDate: string): Date {
    this.assertRemindDateValid(remindDate);
    const parsed = new Date(`${remindDate}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.INVALID_REMIND_DATE,
        'Remind date must be a valid ISO date (YYYY-MM-DD).',
      );
    }
    return parsed;
  }

  advanceRecurrence(
    remindAt: Date,
    remindDate: Date,
    recurrence: ReminderRecurrence,
  ): { remindAt: Date; remindDate: Date } {
    const nextRemindAt = new Date(remindAt.getTime());
    const nextRemindDate = new Date(remindDate.getTime());

    switch (recurrence) {
      case 'DAILY':
        nextRemindAt.setUTCDate(nextRemindAt.getUTCDate() + 1);
        nextRemindDate.setUTCDate(nextRemindDate.getUTCDate() + 1);
        break;
      case 'WEEKLY':
        nextRemindAt.setUTCDate(nextRemindAt.getUTCDate() + 7);
        nextRemindDate.setUTCDate(nextRemindDate.getUTCDate() + 7);
        break;
      case 'MONTHLY':
        nextRemindAt.setUTCMonth(nextRemindAt.getUTCMonth() + 1);
        nextRemindDate.setUTCMonth(nextRemindDate.getUTCMonth() + 1);
        break;
      case 'NONE':
        break;
    }

    return { remindAt: nextRemindAt, remindDate: nextRemindDate };
  }

  private assertTitleRequired(title: string): void {
    if (title.trim().length === 0) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.TITLE_REQUIRED,
        'Reminder title is required.',
      );
    }
  }

  private assertRemindDateValid(remindDate: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(remindDate)) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.INVALID_REMIND_DATE,
        'Remind date must be a valid ISO date (YYYY-MM-DD).',
      );
    }
  }

  private assertRemindTimeValid(remindTime: string): void {
    if (!REMIND_TIME_PATTERN.test(remindTime)) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.INVALID_REMIND_TIME,
        'Remind time must match HH:mm.',
      );
    }

    const [hoursRaw, minutesRaw] = remindTime.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.INVALID_REMIND_TIME,
        'Remind time must be a valid 24-hour clock value.',
      );
    }
  }

  private assertAssignedUserRequired(assignedUserId: string): void {
    if (assignedUserId.trim().length === 0) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.ASSIGNED_USER_REQUIRED,
        'Assigned user is required.',
      );
    }
  }

  private assertNotificationEventKeyRequired(notificationEventKey: string): void {
    if (notificationEventKey.trim().length === 0) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.NOTIFICATION_EVENT_KEY_REQUIRED,
        'Notification event key is required.',
      );
    }
  }

  private assertRecurrenceValid(recurrence: ReminderRecurrence): void {
    if (!VALID_RECURRENCES.includes(recurrence)) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.INVALID_RECURRENCE,
        'Reminder recurrence is invalid.',
      );
    }
  }

  private assertCreatableStatus(status: ReminderStatus): void {
    if (status !== 'PENDING') {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'New reminders must start as PENDING.',
      );
    }
  }

  private assertMutableStatus(status: ReminderStatus): void {
    if (!MUTABLE_STATUSES.includes(status) && !VALID_STATUSES.includes(status)) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Reminder status is invalid.',
      );
    }

    if (status === 'CANCELLED') {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Use the delete endpoint to cancel a reminder.',
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Reminder status is invalid.',
      );
    }
  }

  private assertReminderIsActive(reminder: ReminderRecord): void {
    if (reminder.deletedAt !== null || reminder.status === 'CANCELLED') {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.REMINDER_ARCHIVED,
        'Reminder is cancelled and cannot be modified.',
      );
    }
  }
}

function formatDateOnlyUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}
