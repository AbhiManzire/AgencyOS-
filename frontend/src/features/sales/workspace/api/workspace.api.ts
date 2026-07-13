import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  QuickActionPayload,
  QuickActionResult,
  WorkspaceCalendarParams,
  WorkspaceCalendarResult,
  WorkspaceDashboardResult,
  ListWorkspaceQueueParams,
  WorkspaceQueueResult,
} from '@/features/sales/workspace/api/workspace.types';

/** Fetches the sales workspace dashboard for the current user. */
export async function getWorkspaceDashboard(): Promise<WorkspaceDashboardResult> {
  const response = await apiClient.get<ApiSuccessResponse<WorkspaceDashboardResult>>(
    '/sales-workspace/dashboard',
  );
  return response.data.data;
}

/** Fetches the priority-sorted My Queue for the current user. */
export async function getWorkspaceQueue(
  params: ListWorkspaceQueueParams = {},
): Promise<WorkspaceQueueResult> {
  const response = await apiClient.get<
    ApiSuccessResponse<{ readonly items: WorkspaceQueueResult['items']; readonly total: number }>
  >('/sales-workspace/queue', {
    params: {
      skip: params.skip ?? 0,
      take: params.take ?? 25,
    },
  });

  const { data, meta } = response.data;

  return {
    items: data.items,
    total: meta?.total ?? data.total,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}

/** Fetches calendar events for the current user. */
export async function getWorkspaceCalendar(
  params: WorkspaceCalendarParams = {},
): Promise<WorkspaceCalendarResult> {
  const response = await apiClient.get<ApiSuccessResponse<WorkspaceCalendarResult>>(
    '/sales-workspace/calendar',
    {
      params: {
        view: params.view ?? 'month',
        from: params.from,
        to: params.to,
      },
    },
  );
  return response.data.data;
}

/** Executes a sales workspace quick action. */
export async function executeQuickAction(payload: QuickActionPayload): Promise<QuickActionResult> {
  const response = await apiClient.post<ApiSuccessResponse<QuickActionResult>>(
    '/sales-workspace/quick-actions',
    payload,
  );
  return response.data.data;
}
