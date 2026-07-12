'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { EmptyState, ErrorState, LoadingState } from '@/design-system';
import { AnalyticsChart } from '@/features/reports/components/analytics-chart';
import {
  defaultReportFilters,
  ReportFilters,
  type ReportFilterState,
} from '@/features/reports/components/report-filters';
import { ReportMetrics } from '@/features/reports/components/report-metrics';
import { useAnalytics } from '@/features/reports/hooks/use-analytics';
import {
  ANALYTICS_DOMAIN_OPTIONS,
  type AnalyticsDomain,
  type ReportQueryParams,
} from '@/features/reports/api/reports.types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

function toQueryParams(filters: ReportFilterState): ReportQueryParams {
  return {
    from: filters.from,
    to: filters.to,
    period: filters.period,
    clientId: filters.clientId || undefined,
    projectId: filters.projectId || undefined,
    departmentId: filters.departmentId || undefined,
    ownerUserId: filters.ownerUserId || undefined,
    currency: filters.currency || undefined,
  };
}

/** Domain analytics view with live KPIs and charts. */
export function AnalyticsPanel() {
  const [domain, setDomain] = useState<AnalyticsDomain>('founder');
  const [filters, setFilters] = useState<ReportFilterState>(() => defaultReportFilters('founder'));

  const rangeValid = filters.from.length > 0 && filters.to.length > 0 && filters.from <= filters.to;
  const params = useMemo(() => toQueryParams(filters), [filters]);
  const { analytics, isLoading, isError, error, refetch, isFetching } = useAnalytics(
    domain,
    params,
    rangeValid,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex min-w-[10rem] flex-col gap-1">
          <label htmlFor="analytics-domain" className="text-xs font-medium text-muted-foreground">
            Domain
          </label>
          <NativeSelect
            id="analytics-domain"
            label="Domain"
            value={domain}
            onChange={(event) => {
              setDomain(event.target.value as AnalyticsDomain);
            }}
          >
            {ANALYTICS_DOMAIN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <ReportFilters
        filters={filters}
        showReportType={false}
        onChange={(patch) => {
          setFilters((current) => ({ ...current, ...patch }));
        }}
      />

      {!rangeValid ? (
        <EmptyState
          title="Invalid date range"
          description="Choose a From date on or before the To date."
        />
      ) : null}

      {rangeValid && isLoading ? <LoadingState label="Loading analytics..." /> : null}

      {rangeValid && isError ? (
        <ErrorState
          message={extractApiErrorMessage(error)}
          action={
            <Button type="button" variant="outline" onClick={refetch}>
              Try again
            </Button>
          }
        />
      ) : null}

      {rangeValid && analytics ? (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {analytics.from} → {analytics.to} · {analytics.granularity}
            {isFetching ? ' · Refreshing…' : ''}
          </p>
          <ReportMetrics metrics={analytics.metrics} currency={analytics.currency} />
          <div className="grid gap-4 lg:grid-cols-2">
            {analytics.series.map((series) => (
              <AnalyticsChart key={series.key} series={series} currency={analytics.currency} />
            ))}
            {analytics.breakdowns.map((breakdown) => (
              <AnalyticsChart
                key={breakdown.key}
                breakdown={breakdown}
                currency={analytics.currency}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
