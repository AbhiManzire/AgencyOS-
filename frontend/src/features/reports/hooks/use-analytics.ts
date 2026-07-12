'use client';

import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/features/reports/api/reports.api';
import type {
  AnalyticsDomain,
  AnalyticsResult,
  ReportQueryParams,
} from '@/features/reports/api/reports.types';
import { reportsQueryKeys } from '@/features/reports/hooks/reports-query-keys';

interface UseAnalyticsResult {
  readonly analytics: AnalyticsResult | undefined;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly refetch: () => void;
}

/** TanStack Query hook for domain analytics + chart series. */
export function useAnalytics(
  domain: AnalyticsDomain,
  params: ReportQueryParams,
  enabled = true,
): UseAnalyticsResult {
  const query = useQuery({
    queryKey: reportsQueryKeys.analytics(domain, params),
    queryFn: () => getAnalytics(domain, params),
    enabled: enabled && params.from.length > 0 && params.to.length > 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    analytics: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
