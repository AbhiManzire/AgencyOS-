import type {
  FollowUpPriority,
  FollowUpRecurrence,
  FollowUpReminderType,
  FollowUpStatus,
  Prisma,
} from '@prisma/client';
import type { ActivityRecord } from '../../repositories/activity.repository.interface';
import type { FollowUpRecord } from '../repositories/follow-up.repository.interface';

export interface FollowUpApplicationContext {
  readonly actorUserId: string;
}

export interface FollowUpScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface CreateFollowUpCommand {
  readonly entityType: string;
  readonly entityId: string;
  readonly title: string;
  readonly description?: string;
  readonly followUpDate: string;
  readonly followUpTime: string;
  readonly priority?: FollowUpPriority;
  readonly assignedUserId: string;
  readonly reminderType: FollowUpReminderType;
  readonly recurrence?: FollowUpRecurrence;
  readonly metadata?: Prisma.InputJsonValue;
}

export interface UpdateFollowUpCommand {
  readonly title?: string;
  readonly description?: string | null;
  readonly followUpDate?: string;
  readonly followUpTime?: string;
  readonly priority?: FollowUpPriority;
  readonly assignedUserId?: string;
  readonly reminderType?: FollowUpReminderType;
  readonly recurrence?: FollowUpRecurrence;
  readonly metadata?: Prisma.InputJsonValue | null;
}

export interface ListFollowUpsQuery {
  readonly entityType?: string;
  readonly entityId?: string;
  readonly status?: FollowUpStatus;
  readonly assignedUserId?: string;
  readonly from?: Date;
  readonly to?: Date;
  readonly skip?: number;
  readonly take?: number;
}

export interface ListFollowUpsResult {
  readonly items: readonly FollowUpRecord[];
  readonly total: number;
}

export interface FollowUpDashboardBucket {
  readonly count: number;
  readonly items: readonly FollowUpRecord[];
}

export interface FollowUpDashboardSummary {
  readonly todaysFollowUps: FollowUpDashboardBucket;
  readonly overdueFollowUps: FollowUpDashboardBucket;
  readonly completedToday: FollowUpDashboardBucket;
  readonly upcomingMeetings: FollowUpDashboardBucket;
  readonly recentActivity: {
    readonly count: number;
    readonly items: readonly ActivityRecord[];
  };
}
