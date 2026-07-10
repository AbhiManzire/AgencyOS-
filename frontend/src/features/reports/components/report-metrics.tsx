'use client';

import { DataCard } from '@/design-system';
import type { FounderReport } from '@/features/reports/api/reports.types';
import { formatMoney } from '@/lib/format/money';

interface ReportMetricsProps {
  readonly report: FounderReport;
}

function formatMetricValue(value: number, format: 'number' | 'currency', currency: string): string {
  if (format === 'currency') {
    return formatMoney(value, currency, 2);
  }

  return new Intl.NumberFormat('en-US').format(value);
}

/** Summary metric cards for the active founder report. */
export function ReportMetrics({ report }: ReportMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {report.metrics.map((metric) => (
        <DataCard
          key={metric.key}
          label={metric.label}
          value={formatMetricValue(metric.value, metric.format, report.currency)}
        />
      ))}
    </div>
  );
}
