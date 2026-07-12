'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { AnalyticsPanel } from '@/features/reports/components/analytics-panel';
import { ExportButtons } from '@/features/reports/components/export-csv-button';
import {
  defaultReportFilters,
  ReportFilters,
  type ReportFilterState,
} from '@/features/reports/components/report-filters';
import { ReportMetrics } from '@/features/reports/components/report-metrics';
import { ReportTable } from '@/features/reports/components/report-table';
import { SchedulesPanel } from '@/features/reports/components/schedules-panel';
import { useReport } from '@/features/reports/hooks/use-report';
import type { ReportQueryParams } from '@/features/reports/api/reports.types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { cn } from '@/lib/utils';

type ReportsTab = 'reports' | 'analytics' | 'schedules';

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

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportsTab>('reports');
  const [filters, setFilters] = useState<ReportFilterState>(() => defaultReportFilters('founder'));

  const rangeValid = filters.from.length > 0 && filters.to.length > 0 && filters.from <= filters.to;
  const params = useMemo(() => toQueryParams(filters), [filters]);
  const { report, isLoading, isError, error, refetch, isFetching } = useReport(
    filters.reportType,
    params,
    tab === 'reports' && rangeValid,
  );

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Reports & Analytics"
        description="Executive reports, live analytics, and email-ready schedules from workspace data."
        actions={
          tab === 'reports' ? (
            <ExportButtons reportType={filters.reportType} params={params} disabled={!rangeValid} />
          ) : null
        }
      />

      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          {(
            [
              { id: 'reports', label: 'Reports' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'schedules', label: 'Schedules' },
            ] as const
          ).map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={tab === item.id ? 'default' : 'ghost'}
              className={cn('h-8', tab === item.id ? '' : 'text-muted-foreground')}
              onClick={() => {
                setTab(item.id);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {tab === 'reports' ? (
          <div className="space-y-6">
            <ReportFilters
              filters={filters}
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

            {rangeValid && isLoading ? <LoadingState label="Loading report..." /> : null}

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

            {rangeValid && report ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    {report.from} → {report.to}
                    {isFetching ? ' · Refreshing…' : ''}
                  </p>
                </div>
                <ReportMetrics report={report} />
                <ReportTable report={report} />
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === 'analytics' ? <AnalyticsPanel /> : null}
        {tab === 'schedules' ? <SchedulesPanel /> : null}
      </div>
    </PageContainer>
  );
}
