'use client';

import { Card, CardContent, CardHeader, LoadingState } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';

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

export interface ProjectProgressMetrics {
  readonly milestonesTotal: number;
  readonly milestonesCompleted: number;
  readonly tasksTotal: number;
  readonly tasksDone: number;
  readonly completionPercent: number;
}

interface ProjectDetailProgressCardProps {
  readonly metrics: ProjectProgressMetrics | undefined;
  readonly isLoading?: boolean;
}

export function ProjectDetailProgressCard({
  metrics,
  isLoading = false,
}: ProjectDetailProgressCardProps) {
  if (isLoading || metrics === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState label="Loading progress..." />
        </CardContent>
      </Card>
    );
  }

  const milestoneLabel =
    metrics.milestonesTotal === 0
      ? '0'
      : `${String(metrics.milestonesCompleted)}/${String(metrics.milestonesTotal)}`;
  const taskLabel =
    metrics.tasksTotal === 0 ? '0' : `${String(metrics.tasksDone)}/${String(metrics.tasksTotal)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <ProgressMetric
            label="Milestones"
            value={milestoneLabel}
            hint={
              metrics.milestonesTotal === 0 ? 'No milestones yet' : 'Completed vs total milestones'
            }
          />
          <ProgressMetric
            label="Tasks"
            value={taskLabel}
            hint={metrics.tasksTotal === 0 ? 'No tasks yet' : 'Done vs total tasks'}
          />
          <ProgressMetric
            label="Completion"
            value={`${String(metrics.completionPercent)}%`}
            hint="Average milestone progress"
          />
        </div>
      </CardContent>
    </Card>
  );
}
