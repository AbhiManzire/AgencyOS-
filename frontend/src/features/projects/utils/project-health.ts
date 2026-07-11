import type { ProjectRecord } from '@/features/projects/api/project.types';
import type { ProjectStatus } from '@/features/projects/types';

export type ProjectHealthIndicator = 'green' | 'yellow' | 'red';

export interface ProjectHealthMetrics {
  readonly completionPercent: number | null;
  readonly budgetUtilizationPercent: number | null;
  readonly hoursUtilizationPercent: number | null;
  readonly daysRemaining: number | null;
  readonly indicator: ProjectHealthIndicator;
  readonly indicatorLabel: string;
}

interface ComputeProjectHealthInput {
  readonly project: ProjectRecord;
  readonly completionPercent: number | null;
  readonly spentAmount: number | null;
  readonly asOf?: Date;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetweenUtc(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / msPerDay);
}

function isDeliveryStatus(status: ProjectStatus): boolean {
  return status === 'ACTIVE' || status === 'ON_HOLD' || status === 'PLANNING';
}

/** Derives project health from live project fields and optional spend. */
export function computeProjectHealth({
  project,
  completionPercent,
  spentAmount,
  asOf = new Date(),
}: ComputeProjectHealthInput): ProjectHealthMetrics {
  const hoursUtilizationPercent =
    project.estimatedHours !== null && project.estimatedHours > 0 && project.actualHours !== null
      ? roundPercent((project.actualHours / project.estimatedHours) * 100)
      : null;

  const budgetUtilizationPercent =
    project.budgetAmount !== null && project.budgetAmount > 0 && spentAmount !== null
      ? roundPercent((spentAmount / project.budgetAmount) * 100)
      : null;

  const daysRemaining =
    project.targetEndDate !== null ? daysBetweenUtc(asOf, new Date(project.targetEndDate)) : null;

  let indicator: ProjectHealthIndicator = 'green';
  let indicatorLabel = 'On track';

  if (project.status === 'CANCELLED' || project.status === 'ARCHIVED') {
    indicator = 'red';
    indicatorLabel = project.status === 'CANCELLED' ? 'Cancelled' : 'Archived';
  } else if (project.status === 'COMPLETED' || project.status === 'INVOICE_READY') {
    indicator = 'green';
    indicatorLabel = 'Complete';
  } else if (isDeliveryStatus(project.status)) {
    const overdue = daysRemaining !== null && daysRemaining < 0;
    const overHours = hoursUtilizationPercent !== null && hoursUtilizationPercent > 100;
    const overBudget = budgetUtilizationPercent !== null && budgetUtilizationPercent > 100;

    if (overdue || overHours || overBudget) {
      indicator = 'red';
      indicatorLabel = overdue ? 'Overdue' : overBudget ? 'Over budget' : 'Over hours';
    } else if (
      (daysRemaining !== null && daysRemaining <= 7) ||
      (hoursUtilizationPercent !== null && hoursUtilizationPercent >= 80) ||
      (budgetUtilizationPercent !== null && budgetUtilizationPercent >= 80) ||
      (completionPercent !== null &&
        completionPercent < 40 &&
        daysRemaining !== null &&
        daysRemaining <= 14)
    ) {
      indicator = 'yellow';
      indicatorLabel = 'At risk';
    }
  }

  return {
    completionPercent,
    budgetUtilizationPercent,
    hoursUtilizationPercent,
    daysRemaining,
    indicator,
    indicatorLabel,
  };
}
