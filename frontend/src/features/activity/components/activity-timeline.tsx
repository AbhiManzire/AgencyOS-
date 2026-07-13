'use client';

import type { LucideIcon } from 'lucide-react';
import { Activity as ActivityIconLucide, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/design-system';
import { ActivityCard } from '@/features/activity/components/activity-card';
import { ActivityFilters } from '@/features/activity/components/activity-filters';
import { LogActivityForm } from '@/features/activity/components/log-activity-form';
import { useActivities } from '@/features/activity/hooks/use-activities';
import type { ActivityTimelineEntry, ActivityTimelineFilters } from '@/features/activity/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { cn } from '@/lib/utils';

interface ActivityTimelineProps {
  readonly entityType: string;
  readonly entityId: string;
  readonly entries?: readonly ActivityTimelineEntry[];
  readonly emptyTitle?: string;
  readonly emptyDescription?: string;
  readonly className?: string;
  readonly showFilters?: boolean;
  readonly showLogButton?: boolean;
}

/** Reusable vertical activity timeline attachable to any entity. */
export function ActivityTimeline({
  entityType,
  entityId,
  entries,
  emptyTitle = 'No activity yet',
  emptyDescription = 'Activity for this record will appear here.',
  className,
  showFilters = true,
  showLogButton = true,
}: ActivityTimelineProps) {
  const shouldFetchEntries = entries === undefined;
  const [filters, setFilters] = useState<ActivityTimelineFilters>({});
  const [logOpen, setLogOpen] = useState(false);

  const {
    data: fetchedEntries = [],
    isLoading,
    error,
    refetch,
  } = useActivities(entityType, entityId, {
    enabled: shouldFetchEntries,
    filters: shouldFetchEntries ? filters : undefined,
  });

  const timelineEntries = useMemo(() => {
    const source = entries ?? fetchedEntries;
    return [...source].sort((left, right) => {
      const leftTime =
        left.timestamp instanceof Date
          ? left.timestamp.getTime()
          : new Date(left.timestamp).getTime();
      const rightTime =
        right.timestamp instanceof Date
          ? right.timestamp.getTime()
          : new Date(right.timestamp).getTime();
      return rightTime - leftTime;
    });
  }, [entries, fetchedEntries]);

  return (
    <div className={cn('space-y-4', className)}>
      {shouldFetchEntries && (showFilters || showLogButton) ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {showFilters ? <ActivityFilters filters={filters} onChange={setFilters} /> : <span />}
            {showLogButton ? (
              <Button
                type="button"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setLogOpen(true);
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                Log activity
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {shouldFetchEntries && isLoading ? <LoadingState label="Loading activity..." /> : null}

      {shouldFetchEntries && error ? (
        <ErrorState
          message={extractApiErrorMessage(error)}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : null}

      {!isLoading && !error && timelineEntries.length === 0 ? (
        <EmptyState
          icon={ActivityIconLucide as LucideIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={
            shouldFetchEntries && showLogButton ? (
              <Button
                type="button"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setLogOpen(true);
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                Log activity
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {!isLoading && !error && timelineEntries.length > 0 ? (
        <ol className="space-y-0" aria-label="Activity timeline">
          {timelineEntries.map((entry, index) => (
            <li key={entry.id} className="relative pb-8 last:pb-0">
              {index < timelineEntries.length - 1 ? (
                <span
                  className="absolute left-4 top-8 h-[calc(100%-0.5rem)] w-px bg-border"
                  aria-hidden="true"
                />
              ) : null}
              <ActivityCard entry={entry} />
            </li>
          ))}
        </ol>
      ) : null}

      {shouldFetchEntries && showLogButton ? (
        <LogActivityForm
          open={logOpen}
          onOpenChange={setLogOpen}
          entityType={entityType}
          entityId={entityId}
        />
      ) : null}
    </div>
  );
}
