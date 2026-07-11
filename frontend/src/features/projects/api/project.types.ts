import type { ProjectPriority, ProjectStatus } from '@/features/projects/types';

/** Project row returned by GET /projects — mirrors backend ProjectRecord. */
export interface ProjectRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly departmentId: string | null;
  readonly name: string;
  readonly code: string | null;
  readonly description: string | null;
  readonly status: ProjectStatus;
  readonly projectManagerUserId: string | null;
  readonly priority: ProjectPriority;
  readonly startDate: string | null;
  readonly targetEndDate: string | null;
  readonly budgetAmount: number | null;
  readonly estimatedHours: number | null;
  readonly actualHours: number | null;
  readonly completedAt: string | null;
  readonly invoiceReadyAt: string | null;
  readonly isBillable: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListProjectsParams {
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
  readonly sortBy?: 'updatedAt' | 'name' | 'status' | 'priority' | 'targetEndDate' | 'createdAt';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface ListProjectsResult {
  readonly items: readonly ProjectRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

/** Request body for POST /projects — mirrors backend CreateProjectDto. */
export interface CreateProjectPayload {
  readonly clientId: string;
  readonly name: string;
  readonly code?: string;
  readonly description?: string;
  readonly status?: ProjectStatus;
  readonly projectManagerUserId: string;
  readonly departmentId?: string;
  readonly priority?: ProjectPriority;
  readonly startDate?: string;
  readonly targetEndDate?: string;
  readonly budgetAmount?: number;
  readonly estimatedHours?: number;
  readonly actualHours?: number;
  readonly isBillable?: boolean;
}

/** Request body for PATCH /projects/:id — mirrors backend UpdateProjectDto. */
export interface UpdateProjectPayload {
  readonly name?: string;
  readonly code?: string | null;
  readonly description?: string | null;
  readonly status?: ProjectStatus;
  readonly projectManagerUserId?: string;
  readonly departmentId?: string | null;
  readonly priority?: ProjectPriority;
  readonly startDate?: string | null;
  readonly targetEndDate?: string | null;
  readonly budgetAmount?: number | null;
  readonly estimatedHours?: number | null;
  readonly actualHours?: number | null;
  readonly isBillable?: boolean;
}
