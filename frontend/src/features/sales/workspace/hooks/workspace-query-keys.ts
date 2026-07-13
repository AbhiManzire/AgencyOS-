import type { ListWorkspaceQueueParams } from '@/features/sales/workspace/api/workspace.types';
import type { ListSalesTasksParams } from '@/features/sales/workspace/api/sales-task.types';
import type { WorkspaceCalendarParams } from '@/features/sales/workspace/api/workspace.types';

export const workspaceQueryKeys = {
  all: ['sales-workspace'] as const,
  dashboard: () => [...workspaceQueryKeys.all, 'dashboard'] as const,
  queue: (params: ListWorkspaceQueueParams) =>
    [...workspaceQueryKeys.all, 'queue', params] as const,
  calendar: (params: WorkspaceCalendarParams) =>
    [...workspaceQueryKeys.all, 'calendar', params] as const,
};

export const salesTasksQueryKeys = {
  all: ['sales-tasks'] as const,
  list: (params: ListSalesTasksParams) => [...salesTasksQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...salesTasksQueryKeys.all, 'detail', id] as const,
};
