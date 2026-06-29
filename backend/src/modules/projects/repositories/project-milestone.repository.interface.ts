import type { ProjectMilestoneStatus } from '@prisma/client';
import type { ProjectScope } from '../repositories/project.repository.interface';
import type { WorkspaceUserOption } from './project-member.repository.interface';

export const PROJECT_MILESTONE_REPOSITORY = Symbol('PROJECT_MILESTONE_REPOSITORY');

export interface ProjectMilestoneScope extends ProjectScope {
  readonly projectId: string;
}

export interface ProjectMilestoneRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: ProjectMilestoneStatus;
  readonly startDate: Date | null;
  readonly dueDate: Date | null;
  readonly ownerUserId: string | null;
  readonly sortOrder: number;
  readonly completedAt: Date | null;
  readonly progressPercent: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
  readonly ownerDisplayName: string | null;
  readonly ownerEmail: string | null;
}

export interface CreateProjectMilestoneData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly name: string;
  readonly description?: string | null;
  readonly status?: ProjectMilestoneStatus;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly ownerUserId?: string | null;
  readonly sortOrder: number;
  readonly completedAt?: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateProjectMilestoneData {
  readonly name?: string;
  readonly description?: string | null;
  readonly status?: ProjectMilestoneStatus;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly ownerUserId?: string | null;
  readonly completedAt?: Date | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteProjectMilestoneData {
  readonly deletedAt: Date;
  readonly deletedByUserId: string;
  readonly updatedAt: Date;
  readonly updatedByUserId: string;
}

export interface ProjectMilestoneRepository {
  create(data: CreateProjectMilestoneData): Promise<ProjectMilestoneRecord>;
  update(
    scope: ProjectMilestoneScope,
    id: string,
    data: UpdateProjectMilestoneData,
  ): Promise<ProjectMilestoneRecord | null>;
  findById(scope: ProjectMilestoneScope, id: string): Promise<ProjectMilestoneRecord | null>;
  listByProject(scope: ProjectMilestoneScope): Promise<readonly ProjectMilestoneRecord[]>;
  getNextSortOrder(scope: ProjectMilestoneScope): Promise<number>;
  softDelete(
    scope: ProjectMilestoneScope,
    id: string,
    data: SoftDeleteProjectMilestoneData,
  ): Promise<ProjectMilestoneRecord | null>;
  listWorkspaceUsers(scope: ProjectScope): Promise<readonly WorkspaceUserOption[]>;
  isWorkspaceUser(scope: ProjectScope, userId: string): Promise<boolean>;
}
