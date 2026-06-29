import type { ProjectPriority, ProjectStatus } from '@prisma/client';

/** Tenant and workspace scope required on every project repository operation. */
export interface ProjectScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface CreateProjectData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
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
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateProjectData {
  readonly name?: string;
  readonly code?: string | null;
  readonly description?: string | null;
  readonly status?: ProjectStatus;
  readonly projectManagerUserId?: string | null;
  readonly priority?: ProjectPriority;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
  readonly completedAt?: Date | null;
  readonly invoiceReadyAt?: Date | null;
  readonly isBillable?: boolean;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface FindByIdOptions {
  readonly includeArchived?: boolean;
}

export interface ListProjectsParams {
  readonly scope: ProjectScope;
  readonly skip?: number;
  readonly take?: number;
  readonly status?: ProjectStatus;
  readonly clientId?: string;
  readonly includeArchived?: boolean;
}

export interface ListProjectsResult {
  readonly items: readonly ProjectRecord[];
  readonly total: number;
}

export interface ProjectRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly name: string;
  readonly code: string | null;
  readonly description: string | null;
  readonly status: ProjectStatus;
  readonly projectManagerUserId: string | null;
  readonly priority: ProjectPriority;
  readonly startDate: Date | null;
  readonly targetEndDate: Date | null;
  readonly completedAt: Date | null;
  readonly invoiceReadyAt: Date | null;
  readonly isBillable: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface ProjectRepository {
  create(data: CreateProjectData): Promise<ProjectRecord>;
  update(scope: ProjectScope, id: string, data: UpdateProjectData): Promise<ProjectRecord | null>;
  findById(
    scope: ProjectScope,
    id: string,
    options?: FindByIdOptions,
  ): Promise<ProjectRecord | null>;
  findByCode(scope: ProjectScope, code: string): Promise<ProjectRecord | null>;
  list(params: ListProjectsParams): Promise<ListProjectsResult>;
}

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');
