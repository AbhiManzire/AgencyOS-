'use client';

import { Card, CardContent, ErrorState, LoadingState } from '@/design-system';
import { Caption } from '@/design-system/typography';
import { useDealDashboard } from '@/features/sales/hooks/use-deal-metrics';
import { formatDealValue } from '@/features/sales/utils/deal-display';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Button } from '@/components/ui/button';

interface MetricCardProps {
  readonly label: string;
  readonly value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <Caption className="block uppercase tracking-wide text-muted-foreground">{label}</Caption>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export function DealDashboardMetrics() {
  const { data, isLoading, error, refetch } = useDealDashboard();

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  if (isLoading || data === undefined) {
    return <LoadingState label="Loading deal metrics..." />;
  }

  const winRatePct = `${data.winRate.toFixed(0)}%`;
  const velocity =
    data.salesVelocityDays === null ? '—' : `${String(Math.round(data.salesVelocityDays))} days`;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <MetricCard label="Open Deals" value={String(data.openDeals)} />
      <MetricCard label="Won This Month" value={String(data.wonThisMonth)} />
      <MetricCard label="Lost This Month" value={String(data.lostThisMonth)} />
      <MetricCard label="Pipeline Value" value={formatDealValue(data.pipelineValue)} />
      <MetricCard label="Weighted Forecast" value={formatDealValue(data.weightedForecast)} />
      <MetricCard label="Avg Deal Size" value={formatDealValue(data.averageDealSize)} />
      <MetricCard label="Win Rate" value={winRatePct} />
      <MetricCard label="Sales Velocity" value={velocity} />
    </div>
  );
}
