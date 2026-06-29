import type { FollowUpStatus, FollowUpType } from '@/features/sales/follow-ups/types';

/** Follow-up row returned by follow-ups API — mirrors backend FollowUpRecord. */
export interface FollowUpRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly dealId: string;
  readonly subject: string;
  readonly type: FollowUpType;
  readonly scheduledAt: string;
  readonly notes: string | null;
  readonly reminderAt: string | null;
  readonly ownerUserId: string | null;
  readonly ownerDisplayName: string | null;
  readonly ownerEmail: string | null;
  readonly status: FollowUpStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface CreateFollowUpPayload {
  readonly subject: string;
  readonly type: FollowUpType;
  readonly scheduledAt: string;
  readonly notes?: string | null;
  readonly reminderAt?: string | null;
  readonly ownerUserId?: string | null;
  readonly status?: FollowUpStatus;
}

export interface UpdateFollowUpPayload {
  readonly subject?: string;
  readonly type?: FollowUpType;
  readonly scheduledAt?: string;
  readonly notes?: string | null;
  readonly reminderAt?: string | null;
  readonly ownerUserId?: string | null;
  readonly status?: FollowUpStatus;
}
