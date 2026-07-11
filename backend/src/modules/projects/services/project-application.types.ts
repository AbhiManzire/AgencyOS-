import type { ProjectPriority, ProjectStatus } from '@prisma/client';
import type {
  DepartmentOption,
  ListProjectsResult,
  ProjectListSortField,
  ProjectRecord,
  ProjectScope,
  WorkspaceOwnerOption,
} from '../repositories/project.repository.interface';

export interface ProjectApplicationContext {
  readonly actorUserId: string;
}

export interface CreateProjectCommand {
  readonly clientId: string;
  readonly name: string;
  readonly code?: string | null;
  readonly description?: string | null;
  readonly status?: ProjectStatus;
  readonly projectManagerUserId: string;
  readonly departmentId?: string | null;
  readonly priority?: ProjectPriority;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
  readonly budgetAmount?: number | null;
  readonly estimatedHours?: number | null;
  readonly actualHours?: number | null;
  readonly isBillable?: boolean;
}

export interface UpdateProjectCommand {
  readonly name?: string;
  readonly code?: string | null;
  readonly description?: string | null;
  readonly status?: ProjectStatus;
  readonly projectManagerUserId?: string;
  readonly departmentId?: string | null;
  readonly priority?: ProjectPriority;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
  readonly budgetAmount?: number | null;
  readonly estimatedHours?: number | null;
  readonly actualHours?: number | null;
  readonly isBillable?: boolean;
}

export interface RestoreProjectCommand {
  readonly targetStatus?: ProjectStatus;
}

export interface GetProjectOptions {
  readonly includeArchived?: boolean;
}

export interface ListProjectsQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly status?: ProjectStatus;
  readonly clientId?: string;
  readonly includeArchived?: boolean;
  readonly archivedOnly?: boolean;
  readonly q?: string;
  readonly projectManagerUserId?: string;
  readonly departmentId?: string;
  readonly priority?: ProjectPriority;
  readonly sortBy?: ProjectListSortField;
  readonly sortOrder?: 'asc' | 'desc';
}

export type {
  DepartmentOption,
  ListProjectsResult,
  ProjectRecord,
  ProjectScope,
  WorkspaceOwnerOption,
};
