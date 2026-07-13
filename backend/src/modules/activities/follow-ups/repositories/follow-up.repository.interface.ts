import type {
  FollowUpPriority,
  FollowUpRecurrence,
  FollowUpReminderType,
  FollowUpStatus,
  Prisma,
} from '@prisma/client';

export const FOLLOW_UP_REPOSITORY = Symbol('FOLLOW_UP_REPOSITORY');

export interface FollowUpScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface FollowUpRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly title: string;
  readonly description: string | null;
  readonly followUpDate: Date;
  readonly followUpTime: string;
  readonly scheduledAt: Date;
  readonly priority: FollowUpPriority;
  readonly assignedUserId: string;
  readonly assignedUserDisplayName: string | null;
  readonly assignedUserEmail: string | null;
  readonly reminderType: FollowUpReminderType;
  readonly status: FollowUpStatus;
  readonly recurrence: FollowUpRecurrence;
  readonly completedAt: Date | null;
  readonly missedAt: Date | null;
  readonly activityId: string | null;
  readonly metadata: Prisma.JsonValue | null;
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
  readonly entityType: string;
  readonly entityId: string;
  readonly title: string;
  readonly description?: string | null;
  readonly followUpDate: Date;
  readonly followUpTime: string;
  readonly scheduledAt: Date;
  readonly priority?: FollowUpPriority;
  readonly assignedUserId: string;
  readonly reminderType: FollowUpReminderType;
  readonly status?: FollowUpStatus;
  readonly recurrence?: FollowUpRecurrence;
  readonly activityId?: string | null;
  readonly metadata?: Prisma.InputJsonValue | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateFollowUpData {
  readonly title?: string;
  readonly description?: string | null;
  readonly followUpDate?: Date;
  readonly followUpTime?: string;
  readonly scheduledAt?: Date;
  readonly priority?: FollowUpPriority;
  readonly assignedUserId?: string;
  readonly reminderType?: FollowUpReminderType;
  readonly status?: FollowUpStatus;
  readonly recurrence?: FollowUpRecurrence;
  readonly completedAt?: Date | null;
  readonly missedAt?: Date | null;
  readonly activityId?: string | null;
  readonly metadata?: Prisma.InputJsonValue | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteFollowUpData {
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ListFollowUpsParams {
  readonly scope: FollowUpScope;
  readonly skip?: number;
  readonly take?: number;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly status?: FollowUpStatus;
  readonly assignedUserId?: string;
  readonly from?: Date;
  readonly to?: Date;
  readonly completedFrom?: Date;
  readonly completedTo?: Date;
  readonly reminderType?: FollowUpReminderType;
}

export interface ListFollowUpsResult {
  readonly items: readonly FollowUpRecord[];
  readonly total: number;
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
  list(params: ListFollowUpsParams): Promise<ListFollowUpsResult>;
  findPendingOverdue(now: Date, take?: number): Promise<readonly FollowUpRecord[]>;
  markMissed(
    id: string,
    data: { readonly missedAt: Date; readonly updatedAt: Date },
  ): Promise<FollowUpRecord | null>;
}
