'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  AnalyticsBreakdown,
  AnalyticsSeries,
  MetricFormat,
} from '@/features/reports/api/reports.types';
import { formatMoney } from '@/lib/format/money';

const CHART_COLORS = [
  'var(--color-primary, #0f766e)',
  'var(--color-chart-2, #b45309)',
  'var(--color-chart-3, #1d4ed8)',
  'var(--color-chart-4, #be123c)',
  'var(--color-chart-5, #7c3aed)',
  'var(--color-chart-6, #0e7490)',
] as const;

function formatValue(value: number, format: MetricFormat, currency: string): string {
  if (format === 'currency') {
    return formatMoney(value, currency, 0);
  }
  if (format === 'percent') {
    return `${(value * 100).toFixed(1)}%`;
  }
  return new Intl.NumberFormat('en-US').format(value);
}

function withSliceColors(
  items: readonly { name: string; value: number }[],
): { name: string; value: number; fill: string }[] {
  return items.map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length] ?? CHART_COLORS[0],
  }));
}

interface AnalyticsChartProps {
  readonly series?: AnalyticsSeries;
  readonly breakdown?: AnalyticsBreakdown;
  readonly currency: string;
}

/** Renders a single analytics series or breakdown as a Recharts chart. */
export function AnalyticsChart({ series, breakdown, currency }: AnalyticsChartProps) {
  if (series !== undefined) {
    const data = series.points.map((point) => ({
      name: point.period,
      value: point.value,
    }));
    const format = series.format;

    if (series.chartType === 'area') {
      return (
        <ChartShell title={series.label}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={64} />
              <Tooltip formatter={(value) => formatValue(Number(value), format, currency)} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS[0]}
                fill={CHART_COLORS[0]}
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartShell>
      );
    }

    if (series.chartType === 'bar') {
      return (
        <ChartShell title={series.label}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={64} />
              <Tooltip formatter={(value) => formatValue(Number(value), format, currency)} />
              <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>
      );
    }

    if (series.chartType === 'pie') {
      const pieData = withSliceColors(data);
      return (
        <ChartShell title={series.label}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label />
              <Tooltip formatter={(value) => formatValue(Number(value), format, currency)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartShell>
      );
    }

    return (
      <ChartShell title={series.label}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={64} />
            <Tooltip formatter={(value) => formatValue(Number(value), format, currency)} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  if (breakdown !== undefined) {
    const data = breakdown.items.map((item) => ({
      name: item.label,
      value: item.value,
    }));
    const format = breakdown.format;

    if (breakdown.chartType === 'pie') {
      const pieData = withSliceColors(data);
      return (
        <ChartShell title={breakdown.label}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label />
              <Tooltip formatter={(value) => formatValue(Number(value), format, currency)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartShell>
      );
    }

    return (
      <ChartShell title={breakdown.label}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => formatValue(Number(value), format, currency)} />
            <Bar dataKey="value" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  return null;
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {children}
    </div>
  );
}
