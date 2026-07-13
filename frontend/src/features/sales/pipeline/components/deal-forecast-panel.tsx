'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Card, CardContent, CardHeader, ErrorState, LoadingState } from '@/design-system';
import { Caption, CardTitle } from '@/design-system/typography';
import { useDealForecast } from '@/features/sales/hooks/use-deal-metrics';
import type { DealForecastPeriod } from '@/features/sales/types';
import { formatDealValue } from '@/features/sales/utils/deal-display';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

const PERIOD_LABELS: Record<DealForecastPeriod, string> = {
  week: 'This week',
  month: 'This month',
  quarter: 'This quarter',
  year: 'This year',
};

export function DealForecastPanel() {
  const [period, setPeriod] = useState<DealForecastPeriod>('month');
  const { data, isLoading, error, refetch } = useDealForecast(period);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Forecast</CardTitle>
        <NativeSelect
          id="forecast-period"
          label="Forecast period"
          value={period}
          className="w-auto min-w-[10rem]"
          onChange={(event) => {
            setPeriod(event.target.value as DealForecastPeriod);
          }}
        >
          {(Object.keys(PERIOD_LABELS) as DealForecastPeriod[]).map((key) => (
            <option key={key} value={key}>
              {PERIOD_LABELS[key]}
            </option>
          ))}
        </NativeSelect>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState
            message={extractApiErrorMessage(error)}
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          />
        ) : isLoading || data === undefined ? (
          <LoadingState label="Loading forecast..." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ForecastMetric label="Pipeline" value={formatDealValue(data.pipelineValue)} />
            <ForecastMetric label="Weighted" value={formatDealValue(data.weightedForecast)} />
            <ForecastMetric label="Expected" value={formatDealValue(data.expectedRevenue)} />
            <ForecastMetric label="Won" value={formatDealValue(data.wonRevenue)} />
            <ForecastMetric label="Lost" value={formatDealValue(data.lostRevenue)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ForecastMetric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
      <Caption className="block text-muted-foreground">{label}</Caption>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
