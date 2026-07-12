import type { NotificationCategory, NotificationPriority, Prisma } from '@prisma/client';

export interface NotificationScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface NotificationRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly recipientUserId: string;
  readonly category: NotificationCategory;
  readonly priority: NotificationPriority;
  readonly title: string;
  readonly body: string;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly linkPath: string | null;
  readonly isRead: boolean;
  readonly readAt: string | null;
  readonly emailReady: boolean;
  readonly emailSentAt: string | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateNotificationInput {
  readonly recipientUserId: string;
  readonly category: NotificationCategory;
  readonly priority?: NotificationPriority;
  readonly title: string;
  readonly body: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly linkPath?: string;
  readonly emailReady?: boolean;
  readonly metadata?: Prisma.InputJsonValue;
}

export interface ListNotificationsParams {
  readonly scope: NotificationScope;
  readonly recipientUserId: string;
  readonly category?: NotificationCategory;
  readonly isRead?: boolean;
  readonly skip: number;
  readonly take: number;
}

export interface ListNotificationsResult {
  readonly items: readonly NotificationRecord[];
  readonly total: number;
}
