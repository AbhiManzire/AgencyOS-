'use client';

import type { LucideIcon } from 'lucide-react';
import { Activity as ActivityIconLucide } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/design-system';
import { ActivityCard } from '@/features/activity/components/activity-card';
import { useActivities } from '@/features/activity/hooks/use-activities';
import type { ActivityTimelineEntry } from '@/features/activity/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { cn } from '@/lib/utils';

interface ActivityTimelineProps {
  readonly entityType: string;
  readonly entityId: string;
  readonly entries?: readonly ActivityTimelineEntry[];
  readonly emptyTitle?: string;
  readonly emptyDescription?: string;
  readonly className?: string;
}

/** Reusable vertical activity timeline attachable to any entity. */
export function ActivityTimeline({
  entityType,
  entityId,
  entries,
  emptyTitle = 'No activity yet',
  emptyDescription = 'Activity for this record will appear here.',
  className,
}: ActivityTimelineProps) {
  const shouldFetchEntries = entries === undefined;
  const {
    data: fetchedEntries = [],
    isLoading,
    error,
    refetch,
  } = useActivities(entityType, entityId, { enabled: shouldFetchEntries });
  const timelineEntries = entries ?? fetchedEntries;

  if (shouldFetchEntries && isLoading) {
    return <LoadingState label="Loading activity..." />;
  }

  if (shouldFetchEntries && error) {
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

  if (timelineEntries.length === 0) {
    return (
      <EmptyState
        icon={ActivityIconLucide as LucideIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ol className={cn('space-y-0', className)} aria-label="Activity timeline">
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
  );
}
