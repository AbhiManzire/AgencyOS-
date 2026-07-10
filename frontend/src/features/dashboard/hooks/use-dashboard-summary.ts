'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '@/features/dashboard/api/dashboard.api';
import type { DashboardSummary } from '@/features/dashboard/api/dashboard.types';

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardQueryKeys.all, 'summary'] as const,
};

interface UseDashboardSummaryResult {
  readonly summary: DashboardSummary | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly refetch: () => void;
}

/** TanStack Query hook for GET /dashboard/summary. */
export function useDashboardSummary(): UseDashboardSummaryResult {
  const query = useQuery({
    queryKey: dashboardQueryKeys.summary(),
    queryFn: getDashboardSummary,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    summary: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
