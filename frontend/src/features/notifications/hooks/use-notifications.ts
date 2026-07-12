'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveNotification,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/api/notifications.api';
import type { ListNotificationsParams } from '@/features/notifications/api/notifications.types';
import { notificationsQueryKeys } from '@/features/notifications/hooks/notifications-query-keys';

const STALE_TIME = 30_000;

function invalidateNotifications(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.all });
}

export function useNotifications(params: ListNotificationsParams = {}) {
  return useQuery({
    queryKey: notificationsQueryKeys.list(params),
    queryFn: () => listNotifications(params),
    staleTime: STALE_TIME,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationsQueryKeys.unreadCount(),
    queryFn: getUnreadNotificationCount,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      invalidateNotifications(queryClient);
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      invalidateNotifications(queryClient);
    },
  });
}

export function useArchiveNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveNotification(id),
    onSuccess: () => {
      invalidateNotifications(queryClient);
    },
  });
}
