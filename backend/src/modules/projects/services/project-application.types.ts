import type { ProjectPriority, ProjectStatus } from '@prisma/client';
import type {
  ListProjectsResult,
  ProjectRecord,
  ProjectScope,
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
  readonly projectManagerUserId?: string | null;
  readonly priority?: ProjectPriority;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
  readonly isBillable?: boolean;
}

export interface UpdateProjectCommand {
  readonly name?: string;
  readonly code?: string | null;
  readonly description?: string | null;
  readonly status?: ProjectStatus;
  readonly projectManagerUserId?: string | null;
  readonly priority?: ProjectPriority;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
  readonly isBillable?: boolean;
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
}

export type { ListProjectsResult, ProjectRecord, ProjectScope };
