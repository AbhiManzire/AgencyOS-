'use client';

import type { LucideIcon } from 'lucide-react';
import { Avatar } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { ActivityTimelineEntry } from '@/features/activity/types';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  readonly entry: ActivityTimelineEntry;
  readonly className?: string;
}

function formatActivityTimestamp(timestamp: string | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function ActivityIcon({ icon: Icon }: { readonly icon: LucideIcon }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
      <Icon className="size-4" aria-hidden="true" />
    </div>
  );
}

/** Single activity entry card for use inside ActivityTimeline. */
export function ActivityCard({ entry, className }: ActivityCardProps) {
  const initials = entry.actor.initials ?? entry.actor.name.slice(0, 2);

  return (
    <article className={cn('min-w-0', className)}>
      <div className="flex gap-3">
        <ActivityIcon icon={entry.icon} />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold">{entry.title}</CardTitle>
            <Caption className="shrink-0">{formatActivityTimestamp(entry.timestamp)}</Caption>
          </div>

          <div className="flex items-center gap-2">
            <Avatar size="sm" initials={initials} aria-label={entry.actor.name} />
            <Caption className="font-medium text-foreground">{entry.actor.name}</Caption>
          </div>

          {entry.description ? (
            <Body className="text-muted-foreground">{entry.description}</Body>
          ) : null}
        </div>
      </div>
    </article>
  );
}
