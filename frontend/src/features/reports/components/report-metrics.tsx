'use client';

import { DataCard } from '@/design-system';
import type {
  FounderReport,
  MetricFormat,
  ReportMetric,
} from '@/features/reports/api/reports.types';
import { formatMoney } from '@/lib/format/money';

interface ReportMetricsProps {
  readonly report?: Pick<FounderReport, 'metrics' | 'currency'>;
  readonly metrics?: readonly ReportMetric[];
  readonly currency?: string;
}

function formatMetricValue(value: number, format: MetricFormat, currency: string): string {
  if (format === 'currency') {
    return formatMoney(value, currency, 2);
  }
  if (format === 'percent') {
    return `${(value * 100).toFixed(1)}%`;
  }
  return new Intl.NumberFormat('en-US').format(value);
}

/** Summary metric cards for reports or analytics. */
export function ReportMetrics({ report, metrics, currency }: ReportMetricsProps) {
  const items = metrics ?? report?.metrics ?? [];
  const curr = currency ?? report?.currency ?? 'USD';

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((metric) => (
        <DataCard
          key={metric.key}
          label={metric.label}
          value={formatMetricValue(metric.value, metric.format, curr)}
        />
      ))}
    </div>
  );
}
