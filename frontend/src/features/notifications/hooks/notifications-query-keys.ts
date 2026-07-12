import type { ListNotificationsParams } from '@/features/notifications/api/notifications.types';

export const notificationsQueryKeys = {
  all: ['notifications'] as const,
  list: (params?: ListNotificationsParams) =>
    [...notificationsQueryKeys.all, 'list', params ?? {}] as const,
  unreadCount: () => [...notificationsQueryKeys.all, 'unread-count'] as const,
};
