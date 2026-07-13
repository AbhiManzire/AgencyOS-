'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, LoadingState } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { ProjectRecord } from '@/features/projects/api/project.types';
import type { ProjectHealthResult } from '@/features/projects/delivery/api/delivery.types';
import {
  useProjectHealth,
  useRefreshProjectHealth,
} from '@/features/projects/delivery/hooks/use-project-health';
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

const API_STATUS_TO_INDICATOR: Record<
  ProjectHealthResult['status'],
  { indicator: ProjectHealthIndicator; label: string }
> = {
  GREEN: { indicator: 'green', label: 'On track' },
  YELLOW: { indicator: 'yellow', label: 'At risk' },
  RED: { indicator: 'red', label: 'Critical' },
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
  const { metrics, isLoading: isLoadingProgress } = useProjectProgress(project.id);
  const {
    data: apiHealth,
    isLoading: isLoadingHealth,
    isError: isHealthError,
  } = useProjectHealth(project.id);
  const { mutateAsync: refreshHealth, isPending: isRefreshing } = useRefreshProjectHealth(
    project.id,
  );

  if (isLoadingProgress || metrics === undefined || isLoadingHealth) {
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

  const computed = computeProjectHealth({
    project,
    completionPercent: metrics.completionPercent,
    spentAmount: null,
  });

  const fromApi = apiHealth
    ? {
        indicator: API_STATUS_TO_INDICATOR[apiHealth.status].indicator,
        indicatorLabel: API_STATUS_TO_INDICATOR[apiHealth.status].label,
        completionPercent: apiHealth.factors.completionPercent ?? computed.completionPercent,
        budgetUtilizationPercent:
          apiHealth.factors.budgetUtilizationPercent ?? computed.budgetUtilizationPercent,
        hoursUtilizationPercent:
          apiHealth.factors.hoursUtilizationPercent ?? computed.hoursUtilizationPercent,
        daysRemaining: apiHealth.factors.daysRemaining ?? computed.daysRemaining,
        score: apiHealth.score,
      }
    : {
        ...computed,
        score: null as number | null,
      };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3">
          <CardTitle>Project Health</CardTitle>
          {fromApi.score !== null ? (
            <span className="text-sm text-muted-foreground">Score {fromApi.score}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!isHealthError ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isRefreshing}
              onClick={() => {
                void refreshHealth().catch(() => undefined);
              }}
            >
              <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          ) : null}
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
              INDICATOR_STYLES[fromApi.indicator],
            )}
          >
            <span className={cn('size-2 rounded-full', INDICATOR_DOT[fromApi.indicator])} />
            {fromApi.indicatorLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isHealthError ? (
          <Body className="mb-3 text-muted-foreground">
            Using local health estimate — API health unavailable.
          </Body>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <HealthMetric
            label="% Complete"
            value={formatPercent(fromApi.completionPercent)}
            hint={
              metrics.milestonesTotal === 0
                ? 'No milestones yet'
                : `${String(metrics.milestonesCompleted)}/${String(metrics.milestonesTotal)} milestones`
            }
          />
          <HealthMetric
            label="Budget Utilization"
            value={formatPercent(fromApi.budgetUtilizationPercent)}
            hint={
              project.budgetAmount === null
                ? 'No budget set'
                : fromApi.budgetUtilizationPercent === null
                  ? 'Invoiced spend not loaded on detail'
                  : 'Invoiced spend vs budget'
            }
          />
          <HealthMetric
            label="Hours Utilization"
            value={formatPercent(fromApi.hoursUtilizationPercent)}
            hint={
              project.estimatedHours === null
                ? 'No estimate set'
                : 'Actual hours vs estimated hours'
            }
          />
          <HealthMetric
            label="Days Remaining"
            value={formatDaysRemaining(fromApi.daysRemaining)}
            hint={project.targetEndDate === null ? 'No end date set' : 'Until target end date'}
          />
        </div>
      </CardContent>
    </Card>
  );
}
