'use client';

import { Card, CardContent, CardHeader } from '@/design-system';
import { CardTitle, Caption } from '@/design-system/typography';
import {
  formatDurationMinutes,
  formatTimeEntryDateTime,
} from '@/features/time-entries/forms/time-entry-form.validation';
import type { TimeEntrySummaryStats } from '@/features/time-entries/utils/time-entry-summary';

interface TimeSummaryPanelProps {
  readonly summary: TimeEntrySummaryStats;
}

const PLACEHOLDER = '—';

function formatEntryLabel(entry: TimeEntrySummaryStats['firstEntry']): string {
  if (entry === null) {
    return PLACEHOLDER;
  }

  return `${formatTimeEntryDateTime(entry.startTime)} · ${formatDurationMinutes(entry.durationMinutes)}`;
}

export function TimeSummaryPanel({ summary }: TimeSummaryPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Summary</CardTitle>
        <Caption>Overview calculated from logged entries on this task.</Caption>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">First Entry</dt>
            <dd className="text-sm font-medium">{formatEntryLabel(summary.firstEntry)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Last Entry</dt>
            <dd className="text-sm font-medium">{formatEntryLabel(summary.lastEntry)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Average Entry Duration</dt>
            <dd className="text-sm font-medium">
              {summary.totalEntries > 0
                ? formatDurationMinutes(summary.averageDurationMinutes)
                : PLACEHOLDER}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
