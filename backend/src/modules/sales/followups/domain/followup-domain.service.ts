import type { DealFollowUpStatus, DealFollowUpType } from '@prisma/client';
import { FOLLOWUP_DOMAIN_ERROR_CODES, FollowUpDomainError } from './followup-domain.errors';
import type {
  CreateFollowUpValidationInput,
  UpdateFollowUpValidationInput,
} from './followup-domain.types';
import type { FollowUpRecord } from '../repositories/followup.repository.interface';

const VALID_TYPES: readonly DealFollowUpType[] = ['CALL', 'MEETING', 'EMAIL', 'WHATSAPP'];
const VALID_STATUSES: readonly DealFollowUpStatus[] = ['PENDING', 'COMPLETED', 'CANCELLED'];

export class FollowUpDomainService {
  validateCreate(input: CreateFollowUpValidationInput): void {
    this.assertSubjectRequired(input.subject);
    this.assertTypeValid(input.type);
    this.assertScheduledAtValid(input.scheduledAt);

    if (input.status !== undefined) {
      this.assertStatusValid(input.status);
    }
  }

  validateUpdate(followUp: FollowUpRecord, input: UpdateFollowUpValidationInput): void {
    this.assertFollowUpIsActive(followUp);

    if (input.subject !== undefined) {
      this.assertSubjectRequired(input.subject);
    }

    if (input.type !== undefined) {
      this.assertTypeValid(input.type);
    }

    if (input.scheduledAt !== undefined) {
      this.assertScheduledAtValid(input.scheduledAt);
    }

    if (input.status !== undefined) {
      this.assertStatusValid(input.status);
    }
  }

  normalizeSubject(subject: string): string {
    return subject.trim();
  }

  normalizeOptionalNotes(notes: string | null | undefined): string | null {
    if (notes === undefined || notes === null) {
      return null;
    }

    const trimmed = notes.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private assertSubjectRequired(subject: string): void {
    if (subject.trim().length === 0) {
      throw new FollowUpDomainError(
        FOLLOWUP_DOMAIN_ERROR_CODES.SUBJECT_REQUIRED,
        'Follow-up subject is required.',
      );
    }
  }

  private assertTypeValid(type: DealFollowUpType): void {
    if (!VALID_TYPES.includes(type)) {
      throw new FollowUpDomainError(
        FOLLOWUP_DOMAIN_ERROR_CODES.INVALID_TYPE,
        'Follow-up type is invalid.',
      );
    }
  }

  private assertStatusValid(status: DealFollowUpStatus): void {
    if (!VALID_STATUSES.includes(status)) {
      throw new FollowUpDomainError(
        FOLLOWUP_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Follow-up status is invalid.',
      );
    }
  }

  private assertScheduledAtValid(scheduledAt: Date): void {
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new FollowUpDomainError(
        FOLLOWUP_DOMAIN_ERROR_CODES.SCHEDULED_AT_REQUIRED,
        'Scheduled date and time is required.',
      );
    }
  }

  private assertFollowUpIsActive(followUp: FollowUpRecord): void {
    if (followUp.deletedAt !== null) {
      throw new FollowUpDomainError(
        FOLLOWUP_DOMAIN_ERROR_CODES.FOLLOWUP_ARCHIVED,
        'Follow-up is archived and cannot be modified.',
      );
    }
  }
}
