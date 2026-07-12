import type {
  CreateNotificationInput,
  ListNotificationsParams,
  ListNotificationsResult,
  NotificationRecord,
  NotificationScope,
} from '../notification.types';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface NotificationRepository {
  create(scope: NotificationScope, input: CreateNotificationInput): Promise<NotificationRecord>;
  list(params: ListNotificationsParams): Promise<ListNotificationsResult>;
  unreadCount(scope: NotificationScope, recipientUserId: string): Promise<number>;
  findByIdForRecipient(
    scope: NotificationScope,
    id: string,
    recipientUserId: string,
  ): Promise<NotificationRecord | null>;
  markRead(
    scope: NotificationScope,
    id: string,
    recipientUserId: string,
    readAt: Date,
  ): Promise<NotificationRecord | null>;
  markAllRead(scope: NotificationScope, recipientUserId: string, readAt: Date): Promise<number>;
  archive(
    scope: NotificationScope,
    id: string,
    recipientUserId: string,
    deletedAt: Date,
  ): Promise<NotificationRecord | null>;
}
