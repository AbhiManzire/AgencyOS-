import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ListNotificationsParams,
  ListNotificationsResult,
  NotificationRecord,
  UnreadCountResult,
} from '@/features/notifications/api/notifications.types';

function cleanParams(
  params: Record<string, string | number | boolean | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).length > 0) {
      out[key] = String(value);
    }
  }
  return out;
}

export async function listNotifications(
  params: ListNotificationsParams = {},
): Promise<ListNotificationsResult> {
  const response = await apiClient.get<ApiSuccessResponse<ListNotificationsResult>>(
    '/notifications',
    {
      params: cleanParams({
        category: params.category,
        isRead: params.isRead,
        skip: params.skip,
        take: params.take,
      }),
    },
  );
  return response.data.data;
}

export async function getUnreadNotificationCount(): Promise<UnreadCountResult> {
  const response = await apiClient.get<ApiSuccessResponse<UnreadCountResult>>(
    '/notifications/unread-count',
  );
  return response.data.data;
}

export async function markNotificationRead(id: string): Promise<NotificationRecord> {
  const response = await apiClient.post<ApiSuccessResponse<NotificationRecord>>(
    `/notifications/${id}/read`,
  );
  return response.data.data;
}

export async function markAllNotificationsRead(): Promise<{ readonly updated: number }> {
  const response =
    await apiClient.post<ApiSuccessResponse<{ readonly updated: number }>>(
      '/notifications/read-all',
    );
  return response.data.data;
}

export async function archiveNotification(id: string): Promise<void> {
  await apiClient.delete(`/notifications/${id}`);
}
