'use client';

import { Card, CardContent, CardHeader, LoadingState } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import { useProjectHoursSummary } from '@/features/projects/delivery/hooks/use-project-hours-summary';

interface ProjectHoursSummaryCardProps {
  readonly projectId: string;
  readonly fallbackEstimatedHours?: number | null;
  readonly fallbackActualHours?: number | null;
}

function formatHours(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }

  return String(Math.round(value * 10) / 10);
}

export function ProjectHoursSummaryCard({
  projectId,
  fallbackEstimatedHours = null,
  fallbackActualHours = null,
}: ProjectHoursSummaryCardProps) {
  const { data, isLoading, error } = useProjectHoursSummary(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hours summary</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState label="Loading hours..." />
        </CardContent>
      </Card>
    );
  }

  const estimated = data?.estimatedHours ?? fallbackEstimatedHours;
  const actual = data?.actualHours ?? fallbackActualHours;
  const remaining =
    data?.remainingHours ??
    (estimated !== null && actual !== null ? Math.max(estimated - actual, 0) : null);
  const utilization =
    data?.utilizationPercent ??
    (estimated !== null && estimated > 0 && actual !== null
      ? Math.round((actual / estimated) * 1000) / 10
      : null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hours summary</CardTitle>
      </CardHeader>
      <CardContent>
        {error && data === undefined ? (
          <Body className="text-muted-foreground">
            Showing project estimate and actuals. Hours summary API unavailable.
          </Body>
        ) : null}
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-border px-3 py-2">
            <Caption className="block">Estimated</Caption>
            <p className="text-lg font-semibold">{formatHours(estimated)}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <Caption className="block">Actual</Caption>
            <p className="text-lg font-semibold">{formatHours(actual)}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <Caption className="block">Remaining</Caption>
            <p className="text-lg font-semibold">{formatHours(remaining)}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <Caption className="block">Utilization</Caption>
            <p className="text-lg font-semibold">
              {utilization === null ? '—' : `${String(utilization)}%`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
