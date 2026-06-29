import type { DealFollowUpStatus, DealFollowUpType } from '@prisma/client';

export interface CreateFollowUpValidationInput {
  readonly subject: string;
  readonly type: DealFollowUpType;
  readonly scheduledAt: Date;
  readonly status?: DealFollowUpStatus;
}

export interface UpdateFollowUpValidationInput {
  readonly subject?: string;
  readonly type?: DealFollowUpType;
  readonly scheduledAt?: Date;
  readonly status?: DealFollowUpStatus;
}
