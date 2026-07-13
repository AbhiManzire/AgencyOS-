import type {
  FollowUpPriority,
  FollowUpRecurrence,
  FollowUpReminderType,
  FollowUpStatus,
} from '@prisma/client';
import type { FollowUpRecord } from '../repositories/follow-up.repository.interface';
import { FOLLOW_UP_DOMAIN_ERROR_CODES, FollowUpDomainError } from './follow-up-domain.errors';
import {
  FOLLOW_UP_TIME_PATTERN,
  type CreateFollowUpValidationInput,
  type UpdateFollowUpValidationInput,
} from './follow-up-domain.types';

const MUTABLE_STATUSES: readonly FollowUpStatus[] = ['PENDING'];

export class FollowUpDomainService {
  validateCreate(input: CreateFollowUpValidationInput): void {
    this.assertTitleRequired(input.title);
    this.assertEntityRequired(input.entityType, input.entityId);
    this.assertAssignedUserRequired(input.assignedUserId);
    this.assertFollowUpDateValid(input.followUpDate);
    this.assertFollowUpTimeValid(input.followUpTime);
    this.computeScheduledAt(input.followUpDate, input.followUpTime);
  }

  validateUpdate(followUp: FollowUpRecord, input: UpdateFollowUpValidationInput): void {
    this.assertMutable(followUp);

    if (input.title !== undefined) {
      this.assertTitleRequired(input.title);
    }

    if (input.assignedUserId !== undefined) {
      this.assertAssignedUserRequired(input.assignedUserId);
    }

    if (input.followUpDate !== undefined) {
      this.assertFollowUpDateValid(input.followUpDate);
    }

    if (input.followUpTime !== undefined) {
      this.assertFollowUpTimeValid(input.followUpTime);
    }

    const followUpDate = input.followUpDate ?? formatDateOnlyUtc(followUp.followUpDate);
    const followUpTime = input.followUpTime ?? followUp.followUpTime;
    this.computeScheduledAt(followUpDate, followUpTime);
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

  computeScheduledAt(followUpDate: string, followUpTime: string): Date {
    this.assertFollowUpDateValid(followUpDate);
    this.assertFollowUpTimeValid(followUpTime);

    const scheduledAt = new Date(`${followUpDate}T${followUpTime}:00.000Z`);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.INVALID_SCHEDULED_AT,
        'Follow-up date and time could not be combined into a valid UTC timestamp.',
      );
    }

    return scheduledAt;
  }

  parseFollowUpDate(followUpDate: string): Date {
    this.assertFollowUpDateValid(followUpDate);
    const parsed = new Date(`${followUpDate}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.INVALID_FOLLOW_UP_DATE,
        'Follow-up date must be a valid ISO date (YYYY-MM-DD).',
      );
    }
    return parsed;
  }

  assertPriorityValid(priority: FollowUpPriority): void {
    const valid: readonly FollowUpPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!valid.includes(priority)) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.NOT_MUTABLE,
        'Invalid follow-up priority.',
      );
    }
  }

  assertReminderTypeValid(reminderType: FollowUpReminderType): void {
    const valid: readonly FollowUpReminderType[] = [
      'CALL',
      'EMAIL',
      'WHATSAPP',
      'MEETING',
      'FOLLOW_UP',
      'CUSTOM',
    ];
    if (!valid.includes(reminderType)) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.NOT_MUTABLE,
        'Invalid follow-up reminder type.',
      );
    }
  }

  assertRecurrenceValid(recurrence: FollowUpRecurrence): void {
    const valid: readonly FollowUpRecurrence[] = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'];
    if (!valid.includes(recurrence)) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.NOT_MUTABLE,
        'Invalid follow-up recurrence.',
      );
    }
  }

  private assertMutable(followUp: FollowUpRecord): void {
    if (followUp.deletedAt !== null || !MUTABLE_STATUSES.includes(followUp.status)) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.NOT_MUTABLE,
        'Only pending follow-ups can be updated.',
      );
    }
  }

  private assertTitleRequired(title: string): void {
    if (title.trim().length === 0) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.TITLE_REQUIRED,
        'Follow-up title is required.',
      );
    }
  }

  private assertAssignedUserRequired(assignedUserId: string): void {
    if (assignedUserId.trim().length === 0) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.ASSIGNEE_REQUIRED,
        'Assigned user is required.',
      );
    }
  }

  private assertEntityRequired(entityType: string, entityId: string): void {
    if (entityType.trim().length === 0 || entityId.trim().length === 0) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.ENTITY_REQUIRED,
        'Entity type and entity id are required.',
      );
    }
  }

  private assertFollowUpDateValid(followUpDate: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(followUpDate)) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.INVALID_FOLLOW_UP_DATE,
        'Follow-up date must be YYYY-MM-DD.',
      );
    }
  }

  private assertFollowUpTimeValid(followUpTime: string): void {
    if (!FOLLOW_UP_TIME_PATTERN.test(followUpTime)) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.INVALID_FOLLOW_UP_TIME,
        'Follow-up time must match HH:mm.',
      );
    }
  }
}

function formatDateOnlyUtc(value: Date): string {
  return value.toISOString().slice(0, 10);
}
