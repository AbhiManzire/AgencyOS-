export type NotificationCategory = 'TASK' | 'PROJECT' | 'FINANCE' | 'SALES' | 'CLIENT' | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface NotificationRecord {
  readonly id: string;
  readonly category: NotificationCategory;
  readonly priority: NotificationPriority;
  readonly title: string;
  readonly body: string;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly linkPath: string | null;
  readonly isRead: boolean;
  readonly readAt: string | null;
  readonly createdAt: string;
}

export interface ListNotificationsParams {
  readonly category?: string;
  readonly isRead?: boolean;
  readonly skip?: number;
  readonly take?: number;
}

export interface ListNotificationsResult {
  readonly items: readonly NotificationRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface UnreadCountResult {
  readonly count: number;
}
