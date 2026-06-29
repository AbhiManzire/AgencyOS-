import type { TimeEntryListItem } from '@/features/time-entries/types';

export interface TimeEntrySummaryStats {
  readonly totalMinutes: number;
  readonly billableMinutes: number;
  readonly nonBillableMinutes: number;
  readonly totalEntries: number;
  readonly firstEntry: TimeEntryListItem | null;
  readonly lastEntry: TimeEntryListItem | null;
  readonly averageDurationMinutes: number;
}

export function computeTimeEntrySummary(
  entries: readonly TimeEntryListItem[],
): TimeEntrySummaryStats {
  if (entries.length === 0) {
    return {
      totalMinutes: 0,
      billableMinutes: 0,
      nonBillableMinutes: 0,
      totalEntries: 0,
      firstEntry: null,
      lastEntry: null,
      averageDurationMinutes: 0,
    };
  }

  let totalMinutes = 0;
  let billableMinutes = 0;

  for (const entry of entries) {
    totalMinutes += entry.durationMinutes;
    if (entry.billable) {
      billableMinutes += entry.durationMinutes;
    }
  }

  const sortedByStart = [...entries].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  return {
    totalMinutes,
    billableMinutes,
    nonBillableMinutes: totalMinutes - billableMinutes,
    totalEntries: entries.length,
    firstEntry: sortedByStart[0] ?? null,
    lastEntry: sortedByStart[sortedByStart.length - 1] ?? null,
    averageDurationMinutes: Math.round(totalMinutes / entries.length),
  };
}

export function formatHoursFromMinutes(minutes: number): string {
  return `${(minutes / 60).toFixed(2)}h`;
}
