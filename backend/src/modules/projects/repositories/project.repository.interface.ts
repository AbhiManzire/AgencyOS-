import type {
  Prisma,
  ProjectHealthStatus,
  ProjectPriority,
  ProjectServiceType,
  ProjectStatus,
} from '@prisma/client';

/** Tenant and workspace scope required on every project repository operation. */
export interface ProjectScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export type ProjectTransactionClient = Prisma.TransactionClient;

export type ProjectListSortField =
  'updatedAt' | 'name' | 'status' | 'priority' | 'targetEndDate' | 'createdAt';

export interface CreateProjectData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly name: string;
  readonly code?: string | null;
  readonly description?: string | null;
  readonly status?: ProjectStatus;
  readonly projectManagerUserId: string;
  readonly departmentId?: string | null;
  readonly dealId?: string | null;
  readonly templateId?: string | null;
  readonly primaryContactId?: string | null;
  readonly serviceType?: ProjectServiceType | null;
  readonly serviceLabel?: string | null;
  readonly priority?: ProjectPriority;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
  readonly budgetAmount?: number | null;
  readonly estimatedHours?: number | null;
  readonly actualHours?: number | null;
  readonly isBillable?: boolean;
  readonly healthStatus?: ProjectHealthStatus | null;
  readonly healthScore?: number | null;
  readonly healthCalculatedAt?: Date | null;
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
  readonly projectManagerUserId?: string;
  readonly departmentId?: string | null;
  readonly dealId?: string | null;
  readonly templateId?: string | null;
  readonly primaryContactId?: string | null;
  readonly serviceType?: ProjectServiceType | null;
  readonly serviceLabel?: string | null;
  readonly priority?: ProjectPriority;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
  readonly budgetAmount?: number | null;
  readonly estimatedHours?: number | null;
  readonly actualHours?: number | null;
  readonly completedAt?: Date | null;
  readonly invoiceReadyAt?: Date | null;
  readonly isBillable?: boolean;
  readonly healthStatus?: ProjectHealthStatus | null;
  readonly healthScore?: number | null;
  readonly healthCalculatedAt?: Date | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ArchiveProjectData {
  readonly status: ProjectStatus;
  readonly deletedAt: Date;
  readonly deletedByUserId: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface RestoreProjectData {
  readonly status: ProjectStatus;
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
  readonly archivedOnly?: boolean;
  readonly q?: string;
  readonly projectManagerUserId?: string;
  readonly departmentId?: string;
  readonly priority?: ProjectPriority;
  readonly sortBy?: ProjectListSortField;
  readonly sortOrder?: 'asc' | 'desc';
}

export interface ListProjectsResult {
  readonly items: readonly ProjectRecord[];
  readonly total: number;
}

export interface WorkspaceOwnerOption {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
}

export interface DepartmentOption {
  readonly id: string;
  readonly name: string;
}

export interface ProjectRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly departmentId: string | null;
  readonly dealId: string | null;
  readonly templateId: string | null;
  readonly primaryContactId: string | null;
  readonly name: string;
  readonly code: string | null;
  readonly description: string | null;
  readonly status: ProjectStatus;
  readonly serviceType: ProjectServiceType | null;
  readonly serviceLabel: string | null;
  readonly projectManagerUserId: string | null;
  readonly priority: ProjectPriority;
  readonly startDate: Date | null;
  readonly targetEndDate: Date | null;
  readonly budgetAmount: number | null;
  readonly estimatedHours: number | null;
  readonly actualHours: number | null;
  readonly completedAt: Date | null;
  readonly invoiceReadyAt: Date | null;
  readonly isBillable: boolean;
  readonly healthStatus: ProjectHealthStatus | null;
  readonly healthScore: number | null;
  readonly healthCalculatedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface ProjectRepository {
  create(data: CreateProjectData, tx?: ProjectTransactionClient): Promise<ProjectRecord>;
  update(
    scope: ProjectScope,
    id: string,
    data: UpdateProjectData,
    tx?: ProjectTransactionClient,
  ): Promise<ProjectRecord | null>;
  archive(
    scope: ProjectScope,
    id: string,
    data: ArchiveProjectData,
    tx?: ProjectTransactionClient,
  ): Promise<ProjectRecord | null>;
  restore(
    scope: ProjectScope,
    id: string,
    data: RestoreProjectData,
    tx?: ProjectTransactionClient,
  ): Promise<ProjectRecord | null>;
  findById(
    scope: ProjectScope,
    id: string,
    options?: FindByIdOptions,
  ): Promise<ProjectRecord | null>;
  findByCode(scope: ProjectScope, code: string): Promise<ProjectRecord | null>;
  list(params: ListProjectsParams): Promise<ListProjectsResult>;
  listDepartments(scope: ProjectScope): Promise<readonly DepartmentOption[]>;
}

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');
