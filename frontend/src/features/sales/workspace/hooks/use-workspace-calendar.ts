import { useQuery } from '@tanstack/react-query';
import { getWorkspaceCalendar } from '@/features/sales/workspace/api/workspace.api';
import type { WorkspaceCalendarParams } from '@/features/sales/workspace/api/workspace.types';
import { workspaceQueryKeys } from '@/features/sales/workspace/hooks/workspace-query-keys';

/** TanStack Query hook for GET /sales-workspace/calendar. */
export function useWorkspaceCalendar(
  params: WorkspaceCalendarParams = {},
  options?: { readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: workspaceQueryKeys.calendar(params),
    queryFn: () => getWorkspaceCalendar(params),
    enabled: options?.enabled ?? true,
  });
}
