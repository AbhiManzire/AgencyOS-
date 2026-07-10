'use client';

import { useQuery } from '@tanstack/react-query';
import { getReport } from '@/features/reports/api/reports.api';
import type {
  FounderReport,
  ReportDateRangeParams,
  ReportType,
} from '@/features/reports/api/reports.types';
import { reportsQueryKeys } from '@/features/reports/hooks/reports-query-keys';

interface UseReportResult {
  readonly report: FounderReport | undefined;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly refetch: () => void;
}

/** TanStack Query hook for founder report aggregates. */
export function useReport(
  reportType: ReportType,
  params: ReportDateRangeParams,
  enabled = true,
): UseReportResult {
  const query = useQuery({
    queryKey: reportsQueryKeys.report(reportType, params),
    queryFn: () => getReport(reportType, params),
    enabled: enabled && params.from.length > 0 && params.to.length > 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    report: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
