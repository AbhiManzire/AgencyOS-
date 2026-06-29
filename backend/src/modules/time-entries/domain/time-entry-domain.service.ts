import type {
  TimeEntryRecord,
  TimeEntryScope,
} from '../repositories/time-entry.repository.interface';
import { TIME_ENTRY_DOMAIN_ERROR_CODES, TimeEntryDomainError } from './time-entry-domain.errors';
import type {
  CreateTimeEntryValidationInput,
  UpdateTimeEntryValidationInput,
} from './time-entry-domain.types';

const MAX_NOTES_LENGTH = 2000;

export class TimeEntryDomainService {
  validateCreate(input: CreateTimeEntryValidationInput): void {
    this.assertTimeRange(input.startTime, input.endTime);
  }

  validateUpdate(entry: TimeEntryRecord, input: UpdateTimeEntryValidationInput): void {
    this.assertEntryIsActive(entry);

    const startTime = input.startTime ?? entry.startTime;
    const endTime = input.endTime ?? entry.endTime;

    if (endTime !== null) {
      this.assertTimeRange(startTime, endTime);
    }
  }

  validateStop(entry: TimeEntryRecord): void {
    this.assertEntryIsActive(entry);

    if (!entry.isRunning) {
      throw new TimeEntryDomainError(
        TIME_ENTRY_DOMAIN_ERROR_CODES.TIMER_NOT_RUNNING,
        'Time entry is not a running timer.',
      );
    }
  }

  ensureTimerActor(entry: TimeEntryRecord, actorUserId: string): void {
    if (entry.userId !== actorUserId) {
      throw new TimeEntryDomainError(
        TIME_ENTRY_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'Timer can only be controlled by the assigned user.',
      );
    }
  }

  ensureWorkspaceOwnership(scope: TimeEntryScope, entry: TimeEntryRecord): void {
    if (entry.tenantId !== scope.tenantId || entry.workspaceId !== scope.workspaceId) {
      throw new TimeEntryDomainError(
        TIME_ENTRY_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'Time entry does not belong to the requested workspace.',
      );
    }
  }

  computeDurationMinutes(startTime: Date, endTime: Date): number {
    return Math.round((endTime.getTime() - startTime.getTime()) / 60_000);
  }

  normalizeNotes(notes: string | null | undefined): string | null {
    if (notes === undefined || notes === null) {
      return null;
    }

    const trimmed = notes.trim();
    if (trimmed.length === 0) {
      return null;
    }

    if (trimmed.length > MAX_NOTES_LENGTH) {
      throw new TimeEntryDomainError(
        TIME_ENTRY_DOMAIN_ERROR_CODES.INVALID_TIME_RANGE,
        `Notes must be ${String(MAX_NOTES_LENGTH)} characters or fewer.`,
      );
    }

    return trimmed;
  }

  formatLoggedHours(durationMinutes: number): string {
    const hours = durationMinutes / 60;
    if (Number.isInteger(hours)) {
      return String(hours);
    }

    return hours.toFixed(1);
  }

  private assertTimeRange(startTime: Date, endTime: Date): void {
    if (Number.isNaN(startTime.getTime())) {
      throw new TimeEntryDomainError(
        TIME_ENTRY_DOMAIN_ERROR_CODES.START_TIME_REQUIRED,
        'Start time is required.',
      );
    }

    if (Number.isNaN(endTime.getTime())) {
      throw new TimeEntryDomainError(
        TIME_ENTRY_DOMAIN_ERROR_CODES.END_TIME_REQUIRED,
        'End time is required.',
      );
    }

    if (endTime.getTime() <= startTime.getTime()) {
      throw new TimeEntryDomainError(
        TIME_ENTRY_DOMAIN_ERROR_CODES.INVALID_TIME_RANGE,
        'End time must be after start time.',
      );
    }
  }

  private assertEntryIsActive(entry: TimeEntryRecord): void {
    if (entry.deletedAt !== null) {
      throw new TimeEntryDomainError(
        TIME_ENTRY_DOMAIN_ERROR_CODES.TIME_ENTRY_ARCHIVED,
        'Time entry is archived and cannot be modified.',
      );
    }
  }
}
