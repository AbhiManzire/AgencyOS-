import type { DealFollowUpStatus, DealFollowUpType } from '@prisma/client';

export const FOLLOWUP_REPOSITORY = Symbol('FOLLOWUP_REPOSITORY');

export interface FollowUpScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface FollowUpDealScope extends FollowUpScope {
  readonly dealId: string;
}

export interface FollowUpRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly dealId: string;
  readonly subject: string;
  readonly type: DealFollowUpType;
  readonly scheduledAt: Date;
  readonly notes: string | null;
  readonly reminderAt: Date | null;
  readonly ownerUserId: string | null;
  readonly ownerDisplayName: string | null;
  readonly ownerEmail: string | null;
  readonly status: DealFollowUpStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateFollowUpData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly dealId: string;
  readonly subject: string;
  readonly type: DealFollowUpType;
  readonly scheduledAt: Date;
  readonly notes?: string | null;
  readonly reminderAt?: Date | null;
  readonly ownerUserId?: string | null;
  readonly status?: DealFollowUpStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateFollowUpData {
  readonly subject?: string;
  readonly type?: DealFollowUpType;
  readonly scheduledAt?: Date;
  readonly notes?: string | null;
  readonly reminderAt?: Date | null;
  readonly ownerUserId?: string | null;
  readonly status?: DealFollowUpStatus;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteFollowUpData {
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface FollowUpRepository {
  create(data: CreateFollowUpData): Promise<FollowUpRecord>;
  update(
    scope: FollowUpScope,
    id: string,
    data: UpdateFollowUpData,
  ): Promise<FollowUpRecord | null>;
  softDelete(
    scope: FollowUpScope,
    id: string,
    data: SoftDeleteFollowUpData,
  ): Promise<FollowUpRecord | null>;
  findById(scope: FollowUpScope, id: string): Promise<FollowUpRecord | null>;
  listByDeal(scope: FollowUpDealScope): Promise<readonly FollowUpRecord[]>;
}
