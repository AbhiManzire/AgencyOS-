'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, ErrorState, LoadingState } from '@/design-system';
import { Caption, CardTitle } from '@/design-system/typography';
import type { DashboardSummary } from '@/features/dashboard/api/dashboard.types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { cn } from '@/lib/utils';

interface DashboardClientHealthProps {
  readonly summary: DashboardSummary | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly onRetry: () => void;
}

interface HealthSegment {
  readonly label: string;
  readonly count: number;
  readonly barClassName: string;
  readonly total: number;
  readonly suffix?: string;
}

function HealthProgressCard({ label, count, total, barClassName, suffix }: HealthSegment) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <Card padding shadow="none">
      <CardContent className="space-y-3 p-0">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">{label}</CardTitle>
          <Caption className="font-medium text-foreground">
            {suffix ?? count}
            {suffix === undefined ? (
              <span className="text-muted-foreground"> · {percentage}%</span>
            ) : null}
          </Caption>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', barClassName)}
            style={{ width: `${String(percentage)}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label} clients`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardClientHealth({
  summary,
  isLoading,
  isError,
  error,
  onRetry,
}: DashboardClientHealthProps) {
  if (isLoading) {
    return <LoadingState label="Loading client health..." />;
  }

  if (isError || summary === undefined) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }

  const hasSprint6ClientKpis =
    typeof summary.clients.newClients === 'number' &&
    typeof summary.clients.lostClients === 'number' &&
    typeof summary.clients.retentionRate === 'number';

  const active = summary.clients.active;
  const totalForHealth = summary.clients.total;

  const segments: readonly HealthSegment[] = hasSprint6ClientKpis
    ? [
        {
          label: 'Active',
          count: active,
          total: Math.max(totalForHealth, 1),
          barClassName: 'bg-success',
        },
        {
          label: 'New',
          count: summary.clients.newClients,
          total: Math.max(active + summary.clients.newClients, 1),
          barClassName: 'bg-primary',
        },
        {
          label: 'Lost',
          count: summary.clients.lostClients,
          total: Math.max(active + summary.clients.lostClients, 1),
          barClassName: 'bg-destructive',
        },
        {
          label: 'Retention',
          count: Math.round(summary.clients.retentionRate * 100),
          total: 100,
          barClassName: 'bg-success',
          suffix: `${(summary.clients.retentionRate * 100).toFixed(1)}%`,
        },
      ]
    : [
        {
          label: 'Active',
          count: active,
          total: totalForHealth,
          barClassName: 'bg-success',
        },
        {
          label: 'Other',
          count: Math.max(summary.clients.total - active, 0),
          total: totalForHealth,
          barClassName: 'bg-muted-foreground/50',
        },
      ];

  return (
    <div className="space-y-3">
      {segments.map((segment) => (
        <HealthProgressCard key={segment.label} {...segment} />
      ))}
    </div>
  );
}
