'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Caption } from '@/design-system/typography';
import { TaskPriorityBadge } from '@/features/tasks/components/task-priority-badge';
import { TaskStatusBadge } from '@/features/tasks/components/task-status-badge';
import type { TaskRecord } from '@/features/tasks/api/task.types';
import { cn } from '@/lib/utils';

interface TaskCalendarMonthProps {
  readonly tasks: readonly TaskRecord[];
  readonly month: Date;
  readonly onMonthChange: (month: Date) => void;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

function buildCalendarCells(month: Date): Date[] {
  const first = startOfMonth(month);
  const startOffset = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const cell = new Date(gridStart);
    cell.setDate(gridStart.getDate() + index);
    return cell;
  });
}

export function TaskCalendarMonth({ tasks, month, onMonthChange }: TaskCalendarMonthProps) {
  const cells = useMemo(() => buildCalendarCells(month), [month]);
  const tasksByDueDate = useMemo(() => {
    const map = new Map<string, TaskRecord[]>();
    for (const task of tasks) {
      if (task.dueDate === null) {
        continue;
      }

      const key = task.dueDate.slice(0, 10);
      const existing = map.get(key) ?? [];
      existing.push(task);
      map.set(key, existing);
    }
    return map;
  }, [tasks]);

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(month);

  const todayKey = toDateKey(new Date());
  const currentMonth = month.getMonth();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onMonthChange(addMonths(month, -1));
            }}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onMonthChange(startOfMonth(new Date()));
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onMonthChange(addMonths(month, 1));
            }}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-muted/40 px-2 py-2 text-center">
            <Caption className="font-medium uppercase tracking-wide">{day}</Caption>
          </div>
        ))}

        {cells.map((cell) => {
          const key = toDateKey(cell);
          const dayTasks = tasksByDueDate.get(key) ?? [];
          const inCurrentMonth = cell.getMonth() === currentMonth;

          return (
            <div
              key={key}
              className={cn(
                'min-h-[110px] bg-card p-2',
                !inCurrentMonth && 'bg-muted/20 text-muted-foreground',
                key === todayKey && 'ring-1 ring-inset ring-primary/40',
              )}
            >
              <Caption className="mb-2 block tabular-nums">{cell.getDate()}</Caption>
              <ul className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="block truncate rounded-md border border-border bg-background px-1.5 py-1 text-xs hover:border-primary/40"
                      title={task.title}
                    >
                      <span className="font-medium text-foreground">{task.title}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        <TaskStatusBadge status={task.status} />
                        <TaskPriorityBadge priority={task.priority} />
                      </span>
                    </Link>
                  </li>
                ))}
                {dayTasks.length > 3 ? (
                  <li>
                    <Caption>+{dayTasks.length - 3} more</Caption>
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
