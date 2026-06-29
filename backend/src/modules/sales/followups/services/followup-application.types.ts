import type { DealFollowUpStatus, DealFollowUpType } from '@prisma/client';
import type { FollowUpRecord, FollowUpScope } from '../repositories/followup.repository.interface';

export interface FollowUpApplicationContext {
  readonly actorUserId: string;
}

export interface CreateFollowUpCommand {
  readonly subject: string;
  readonly type: DealFollowUpType;
  readonly scheduledAt: Date;
  readonly notes?: string | null;
  readonly reminderAt?: Date | null;
  readonly ownerUserId?: string | null;
  readonly status?: DealFollowUpStatus;
}

export interface UpdateFollowUpCommand {
  readonly subject?: string;
  readonly type?: DealFollowUpType;
  readonly scheduledAt?: Date;
  readonly notes?: string | null;
  readonly reminderAt?: Date | null;
  readonly ownerUserId?: string | null;
  readonly status?: DealFollowUpStatus;
}

export type { FollowUpRecord, FollowUpScope };
