'use client';

import { Card, CardContent, CardHeader, LoadingState } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { ProjectRecord } from '@/features/projects/api/project.types';
import { useProjectProgress } from '@/features/projects/hooks/use-project-progress';
import {
  computeProjectHealth,
  type ProjectHealthIndicator,
} from '@/features/projects/utils/project-health';
import { cn } from '@/lib/utils';

interface ProjectHealthCardProps {
  readonly project: ProjectRecord;
}

interface HealthMetricProps {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}

function HealthMetric({ label, value, hint }: HealthMetricProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <Caption className="block uppercase tracking-wide">{label}</Caption>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      <Body className="mt-1 text-muted-foreground">{hint}</Body>
    </div>
  );
}

const INDICATOR_STYLES: Record<ProjectHealthIndicator, string> = {
  green: 'border-success/20 bg-success-muted text-success',
  yellow: 'border-warning/30 bg-warning-muted text-warning-foreground',
  red: 'border-danger/30 bg-danger-muted text-danger',
};

const INDICATOR_DOT: Record<ProjectHealthIndicator, string> = {
  green: 'bg-success',
  yellow: 'bg-warning',
  red: 'bg-danger',
};

function formatPercent(value: number | null): string {
  return value === null ? '—' : `${String(value)}%`;
}

function formatDaysRemaining(value: number | null): string {
  if (value === null) {
    return '—';
  }

  if (value < 0) {
    return `${String(Math.abs(value))}d overdue`;
  }

  if (value === 0) {
    return 'Due today';
  }

  return `${String(value)}d`;
}

export function ProjectHealthCard({ project }: ProjectHealthCardProps) {
  const { metrics, isLoading } = useProjectProgress(project.id);

  if (isLoading || metrics === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Health</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState label="Loading health..." />
        </CardContent>
      </Card>
    );
  }

  const health = computeProjectHealth({
    project,
    completionPercent: metrics.completionPercent,
    spentAmount: null,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Project Health</CardTitle>
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
            INDICATOR_STYLES[health.indicator],
          )}
        >
          <span className={cn('size-2 rounded-full', INDICATOR_DOT[health.indicator])} />
          {health.indicatorLabel}
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <HealthMetric
            label="% Complete"
            value={formatPercent(health.completionPercent)}
            hint={
              metrics.milestonesTotal === 0
                ? 'No milestones yet'
                : `${String(metrics.milestonesCompleted)}/${String(metrics.milestonesTotal)} milestones`
            }
          />
          <HealthMetric
            label="Budget Utilization"
            value={formatPercent(health.budgetUtilizationPercent)}
            hint={
              project.budgetAmount === null
                ? 'No budget set'
                : health.budgetUtilizationPercent === null
                  ? 'Invoiced spend not loaded on detail'
                  : 'Invoiced spend vs budget'
            }
          />
          <HealthMetric
            label="Hours Utilization"
            value={formatPercent(health.hoursUtilizationPercent)}
            hint={
              project.estimatedHours === null
                ? 'No estimate set'
                : 'Actual hours vs estimated hours'
            }
          />
          <HealthMetric
            label="Days Remaining"
            value={formatDaysRemaining(health.daysRemaining)}
            hint={project.targetEndDate === null ? 'No end date set' : 'Until target end date'}
          />
        </div>
      </CardContent>
    </Card>
  );
}
