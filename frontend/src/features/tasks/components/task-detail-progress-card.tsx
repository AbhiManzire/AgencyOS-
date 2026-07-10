'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { TaskStatus } from '@/features/tasks/types';
import { useTaskSubtasks } from '@/features/tasks/subtasks/hooks/use-task-subtasks';
import { getTaskCompletionPercent } from '@/features/tasks/utils/task-display';
import { useTaskTimeEntries } from '@/features/time-entries/hooks/use-task-time-entries';
import {
  computeTimeEntrySummary,
  formatHoursFromMinutes,
} from '@/features/time-entries/utils/time-entry-summary';

interface TaskDetailProgressCardProps {
  readonly taskId: string;
  readonly status: TaskStatus;
  readonly subtaskCount: number;
}

interface ProgressMetricProps {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}

function ProgressMetric({ label, value, hint }: ProgressMetricProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <Caption className="block uppercase tracking-wide">{label}</Caption>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      <Body className="mt-1 text-muted-foreground">{hint}</Body>
    </div>
  );
}

export function TaskDetailProgressCard({
  taskId,
  status,
  subtaskCount,
}: TaskDetailProgressCardProps) {
  const { data: subtasks = [] } = useTaskSubtasks(taskId);
  const { data: entries = [], isLoading: isTimeLoading } = useTaskTimeEntries(taskId);

  const doneSubtasks = useMemo(
    () => subtasks.filter((subtask) => subtask.status === 'DONE').length,
    [subtasks],
  );

  const completionPercent = getTaskCompletionPercent(
    status,
    subtasks.length > 0 ? { total: subtasks.length, done: doneSubtasks } : undefined,
  );

  const timeSummary = computeTimeEntrySummary(entries);
  const timeLogged =
    isTimeLoading && entries.length === 0 ? '…' : formatHoursFromMinutes(timeSummary.totalMinutes);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <Caption className="uppercase tracking-wide">Completion</Caption>
            <span className="text-sm font-medium tabular-nums text-foreground">
              {completionPercent}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${String(completionPercent)}%` }}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProgressMetric
            label="Subtasks"
            value={String(subtaskCount)}
            hint={
              subtasks.length > 0
                ? `${String(doneSubtasks)} of ${String(subtasks.length)} done`
                : subtaskCount === 1
                  ? '1 subtask'
                  : `${String(subtaskCount)} subtasks`
            }
          />
          <ProgressMetric
            label="Time Logged"
            value={timeLogged}
            hint={
              isTimeLoading && entries.length === 0
                ? 'Loading time entries…'
                : timeSummary.totalEntries === 1
                  ? '1 time entry'
                  : `${String(timeSummary.totalEntries)} time entries`
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
