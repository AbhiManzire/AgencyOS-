import type { ProjectMilestoneStatus } from '@prisma/client';

export const PROJECT_MILESTONE_STATUSES: readonly ProjectMilestoneStatus[] = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'ON_HOLD',
  'CANCELLED',
];

export interface CreateProjectMilestoneValidationInput {
  readonly name: string;
  readonly status?: ProjectMilestoneStatus;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
}

export interface UpdateProjectMilestoneValidationInput {
  readonly name?: string;
  readonly status?: ProjectMilestoneStatus;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
}
