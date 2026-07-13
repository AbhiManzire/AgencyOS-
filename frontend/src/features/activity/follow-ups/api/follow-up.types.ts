export type FollowUpPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type FollowUpReminderType =
  'CALL' | 'EMAIL' | 'WHATSAPP' | 'MEETING' | 'FOLLOW_UP' | 'CUSTOM';

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export type FollowUpRecurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface FollowUpRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly title: string;
  readonly description: string | null;
  readonly followUpDate: string;
  readonly followUpTime: string;
  readonly scheduledAt: string;
  readonly priority: FollowUpPriority;
  readonly assignedUserId: string;
  readonly assignedUserDisplayName: string | null;
  readonly assignedUserEmail: string | null;
  readonly reminderType: FollowUpReminderType;
  readonly status: FollowUpStatus;
  readonly recurrence: FollowUpRecurrence;
  readonly completedAt: string | null;
  readonly missedAt: string | null;
  readonly activityId: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface CreateFollowUpPayload {
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
  readonly metadata?: Record<string, unknown>;
}

export interface UpdateFollowUpPayload {
  readonly title?: string;
  readonly description?: string | null;
  readonly followUpDate?: string;
  readonly followUpTime?: string;
  readonly priority?: FollowUpPriority;
  readonly assignedUserId?: string;
  readonly reminderType?: FollowUpReminderType;
  readonly recurrence?: FollowUpRecurrence;
  readonly metadata?: Record<string, unknown> | null;
}

export interface ListFollowUpsParams {
  readonly entityType?: string;
  readonly entityId?: string;
  readonly status?: FollowUpStatus;
  readonly assignedUserId?: string;
  readonly from?: string;
  readonly to?: string;
  readonly skip?: number;
  readonly take?: number;
}

export interface ListFollowUpsResult {
  readonly items: readonly FollowUpRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
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
    readonly items: readonly {
      readonly id: string;
      readonly title: string;
      readonly type: string;
      readonly createdAt: string;
      readonly entityType: string;
      readonly entityId: string;
    }[];
  };
}

export const FOLLOW_UP_PRIORITY_LABELS: Readonly<Record<FollowUpPriority, string>> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const FOLLOW_UP_REMINDER_TYPE_LABELS: Readonly<Record<FollowUpReminderType, string>> = {
  CALL: 'Call',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  MEETING: 'Meeting',
  FOLLOW_UP: 'Follow-up',
  CUSTOM: 'Custom',
};

export const FOLLOW_UP_STATUS_LABELS: Readonly<Record<FollowUpStatus, string>> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  MISSED: 'Missed',
  CANCELLED: 'Cancelled',
};

export const FOLLOW_UP_RECURRENCE_LABELS: Readonly<Record<FollowUpRecurrence, string>> = {
  NONE: 'None',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};
