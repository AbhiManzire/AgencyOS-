'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { ExportCsvButton } from '@/features/reports/components/export-csv-button';
import { ReportFilters } from '@/features/reports/components/report-filters';
import { ReportMetrics } from '@/features/reports/components/report-metrics';
import { ReportTable } from '@/features/reports/components/report-table';
import { useReport } from '@/features/reports/hooks/use-report';
import type { ReportType } from '@/features/reports/api/reports.types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

function defaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function ReportsPage() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);

  const rangeValid = from.length > 0 && to.length > 0 && from <= to;
  const params = useMemo(() => ({ from, to }), [from, to]);
  const { report, isLoading, isError, error, refetch, isFetching } = useReport(
    reportType,
    params,
    rangeValid,
  );

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Reports"
        description="Founder operational reports with date range and CSV export."
        actions={<ExportCsvButton reportType={reportType} params={params} disabled={!rangeValid} />}
      />

      <div className="space-y-6">
        <ReportFilters
          reportType={reportType}
          from={from}
          to={to}
          onReportTypeChange={setReportType}
          onFromChange={setFrom}
          onToChange={setTo}
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
    </PageContainer>
  );
}
