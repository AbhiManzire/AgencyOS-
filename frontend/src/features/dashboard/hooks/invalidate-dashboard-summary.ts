import type { QueryClient } from '@tanstack/react-query';
import { dashboardQueryKeys } from '@/features/dashboard/hooks/use-dashboard-summary';

/** Invalidates founder dashboard summary caches after domain mutations. */
export async function invalidateDashboardSummary(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
}
