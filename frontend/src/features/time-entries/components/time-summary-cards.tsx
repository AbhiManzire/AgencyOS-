'use client';

import { DataCard } from '@/design-system';
import { formatHoursFromMinutes } from '@/features/time-entries/utils/time-entry-summary';
import type { TimeEntrySummaryStats } from '@/features/time-entries/utils/time-entry-summary';

interface TimeSummaryCardsProps {
  readonly summary: TimeEntrySummaryStats;
}

export function TimeSummaryCards({ summary }: TimeSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DataCard
        label="Total Hours"
        value={formatHoursFromMinutes(summary.totalMinutes)}
        hint="All logged time"
      />
      <DataCard
        label="Billable Hours"
        value={formatHoursFromMinutes(summary.billableMinutes)}
        hint="Billable work"
      />
      <DataCard
        label="Non-Billable Hours"
        value={formatHoursFromMinutes(summary.nonBillableMinutes)}
        hint="Non-billable work"
      />
      <DataCard label="Total Entries" value={summary.totalEntries} hint="Logged sessions" />
    </div>
  );
}
