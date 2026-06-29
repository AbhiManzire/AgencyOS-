'use client';

import { Card, CardContent, LoadingState } from '@/design-system';
import { Caption, CardTitle } from '@/design-system/typography';
import type { DashboardClientStats } from '@/features/dashboard/hooks/use-dashboard-stats';
import { cn } from '@/lib/utils';

interface DashboardClientHealthProps {
  readonly stats: DashboardClientStats;
  readonly isLoading: boolean;
}

interface HealthSegment {
  readonly label: string;
  readonly count: number;
  readonly barClassName: string;
}

function HealthProgressCard({
  label,
  count,
  total,
  barClassName,
}: HealthSegment & { total: number }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <Card padding shadow="none">
      <CardContent className="space-y-3 p-0">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">{label}</CardTitle>
          <Caption className="font-medium text-foreground">
            {count}
            <span className="text-muted-foreground"> · {percentage}%</span>
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

export function DashboardClientHealth({ stats, isLoading }: DashboardClientHealthProps) {
  if (isLoading) {
    return <LoadingState label="Loading client health..." />;
  }

  const totalForHealth = stats.activeClients + stats.prospectClients + stats.archivedClients;
  const segments: readonly HealthSegment[] = [
    {
      label: 'Active',
      count: stats.activeClients,
      barClassName: 'bg-success',
    },
    {
      label: 'Prospect',
      count: stats.prospectClients,
      barClassName: 'bg-primary',
    },
    {
      label: 'Archived',
      count: stats.archivedClients,
      barClassName: 'bg-muted-foreground/50',
    },
  ];

  return (
    <div className="space-y-3">
      {segments.map((segment) => (
        <HealthProgressCard key={segment.label} {...segment} total={totalForHealth} />
      ))}
    </div>
  );
}
