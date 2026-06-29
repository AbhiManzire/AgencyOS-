import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { TaskStatus } from '@/features/tasks/types';
import { getTaskCompletionPercent } from '@/features/tasks/utils/task-display';

interface TaskDetailProgressCardProps {
  readonly status: TaskStatus;
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

export function TaskDetailProgressCard({ status }: TaskDetailProgressCardProps) {
  const completionPercent = getTaskCompletionPercent(status);

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
          <ProgressMetric label="Subtasks" value="—" hint="Subtask tracking coming soon" />
          <ProgressMetric label="Time Logged" value="—" hint="Time entries coming soon" />
        </div>
      </CardContent>
    </Card>
  );
}
