import type { ProjectStatus } from '@prisma/client';

export const PROJECT_CREATABLE_STATUSES: readonly ProjectStatus[] = ['PLANNING', 'ACTIVE'];

export interface CreateProjectValidationInput {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly clientId: string;
  readonly code?: string | null;
  readonly status?: ProjectStatus;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
}

export interface UpdateProjectValidationInput {
  readonly name?: string;
  readonly code?: string | null;
  readonly status?: ProjectStatus;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
}
