import type { ProjectStatus } from '@prisma/client';

export const PROJECT_CREATABLE_STATUSES: readonly ProjectStatus[] = ['PLANNING', 'ACTIVE'];

export const PROJECT_RESTORABLE_STATUSES: readonly ProjectStatus[] = ['PLANNING', 'ACTIVE'];

export interface CreateProjectValidationInput {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly clientId: string;
  readonly projectManagerUserId: string;
  readonly code?: string | null;
  readonly status?: ProjectStatus;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
  readonly budgetAmount?: number | null;
  readonly estimatedHours?: number | null;
  readonly actualHours?: number | null;
}

export interface UpdateProjectValidationInput {
  readonly name?: string;
  readonly code?: string | null;
  readonly status?: ProjectStatus;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
  readonly budgetAmount?: number | null;
  readonly estimatedHours?: number | null;
  readonly actualHours?: number | null;
  readonly projectManagerUserId?: string;
}

export interface ProjectMembershipContext {
  readonly isWorkspaceMember: (userId: string) => boolean;
}

export interface RestoreProjectValidationInput {
  readonly targetStatus?: ProjectStatus;
}
