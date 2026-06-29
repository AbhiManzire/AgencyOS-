'use client';

import type { LucideIcon } from 'lucide-react';
import { Activity } from 'lucide-react';
import { EmptyState } from '@/design-system';
import { ActivityCard } from '@/features/activity/components/activity-card';
import { getMockActivityTimeline } from '@/features/activity/mock/activity.mock';
import type { ActivityTimelineEntry } from '@/features/activity/types';
import { cn } from '@/lib/utils';

interface ActivityTimelineProps {
  readonly entityType: string;
  readonly entityId: string;
  readonly entries?: readonly ActivityTimelineEntry[];
  readonly emptyTitle?: string;
  readonly emptyDescription?: string;
  readonly className?: string;
}

/** Reusable vertical activity timeline attachable to any entity. Uses mock data by default. */
export function ActivityTimeline({
  entityType,
  entityId,
  entries,
  emptyTitle = 'No activity yet',
  emptyDescription = 'Activity for this record will appear here.',
  className,
}: ActivityTimelineProps) {
  const timelineEntries = entries ?? getMockActivityTimeline(entityType, entityId);

  if (timelineEntries.length === 0) {
    return (
      <EmptyState icon={Activity as LucideIcon} title={emptyTitle} description={emptyDescription} />
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
