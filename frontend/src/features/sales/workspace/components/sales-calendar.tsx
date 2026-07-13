'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/design-system';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/design-system';
import { Caption, SectionTitle } from '@/design-system/typography';
import type {
  WorkspaceCalendarEvent,
  WorkspaceCalendarView,
} from '@/features/sales/workspace/api/workspace.types';
import {
  QUEUE_PRIORITY_LABELS,
  QUEUE_PRIORITY_VARIANTS,
  formatWorkspaceDateTime,
} from '@/features/sales/workspace/utils/workspace-labels';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { cn } from '@/lib/utils';

const CALENDAR_VIEWS: readonly { readonly value: WorkspaceCalendarView; readonly label: string }[] =
  [
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' },
    { value: 'day', label: 'Day' },
    { value: 'agenda', label: 'Agenda' },
  ];

interface SalesCalendarProps {
  readonly view: WorkspaceCalendarView;
  readonly events: readonly WorkspaceCalendarEvent[] | undefined;
  readonly from: string | undefined;
  readonly to: string | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly onViewChange: (view: WorkspaceCalendarView) => void;
  readonly onRetry: () => void;
}

/** Sales calendar with month/week/day/agenda switcher and event list. */
export function SalesCalendar({
  view,
  events,
  from,
  to,
  isLoading,
  isError,
  error,
  onViewChange,
  onRetry,
}: SalesCalendarProps) {
  const rangeLabel = useMemo(() => {
    if (from === undefined || to === undefined) {
      return null;
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return null;
    }

    const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
    return `${formatter.format(fromDate)} – ${formatter.format(toDate)}`;
  }, [from, to]);

  const eventsByDay = useMemo(() => {
    if (events === undefined) {
      return [];
    }

    const groups = new Map<string, WorkspaceCalendarEvent[]>();
    for (const event of events) {
      const dayKey = event.startAt.slice(0, 10);
      const existing = groups.get(dayKey);
      if (existing !== undefined) {
        existing.push(event);
      } else {
        groups.set(dayKey, [event]);
      }
    }

    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <SectionTitle className="text-base">Calendar</SectionTitle>
            {rangeLabel ? <Caption>{rangeLabel}</Caption> : null}
          </div>
          <div className="flex flex-wrap gap-1">
            {CALENDAR_VIEWS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={view === option.value ? 'default' : 'outline'}
                className="h-7 px-2 text-xs"
                onClick={() => {
                  onViewChange(option.value);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState
            message={extractApiErrorMessage(error)}
            action={
              <Button variant="outline" onClick={onRetry}>
                Try again
              </Button>
            }
          />
        ) : isLoading ? (
          <LoadingState label="Loading calendar..." />
        ) : events === undefined || events.length === 0 ? (
          <EmptyState
            title="No events in this range"
            description="Tasks, meetings, and follow-ups will appear here."
          />
        ) : view === 'agenda' || view === 'day' ? (
          <ul className="space-y-3">
            {events.map((event) => (
              <CalendarEventRow key={event.id} event={event} />
            ))}
          </ul>
        ) : (
          <div
            className={cn(
              'grid gap-3',
              view === 'week' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3',
            )}
          >
            {eventsByDay.map(([day, dayEvents]) => (
              <div key={day} className="rounded-lg border border-border bg-muted/20 p-3">
                <Caption className="mb-2 font-medium text-foreground">
                  {formatDayHeading(day)}
                </Caption>
                <ul className="space-y-2">
                  {dayEvents.map((event) => (
                    <CalendarEventRow key={event.id} event={event} compact />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CalendarEventRowProps {
  readonly event: WorkspaceCalendarEvent;
  readonly compact?: boolean;
}

function CalendarEventRow({ event, compact = false }: CalendarEventRowProps) {
  return (
    <li className={cn('rounded-md border border-border bg-card p-2.5', compact && 'p-2')}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
        {event.priority ? (
          <StatusBadge variant={QUEUE_PRIORITY_VARIANTS[event.priority]}>
            {QUEUE_PRIORITY_LABELS[event.priority]}
          </StatusBadge>
        ) : null}
      </div>
      <Caption className="mt-1">
        {formatWorkspaceDateTime(event.startAt)}
        {event.kind ? ` · ${event.kind}` : ''}
      </Caption>
    </li>
  );
}

function formatDayHeading(dayKey: string): string {
  const date = new Date(`${dayKey}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return dayKey;
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
