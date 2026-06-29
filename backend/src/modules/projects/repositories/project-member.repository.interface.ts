import type { ProjectMemberRole, ProjectMemberStatus } from '@prisma/client';
import type { ProjectScope } from '../repositories/project.repository.interface';

export const PROJECT_MEMBER_REPOSITORY = Symbol('PROJECT_MEMBER_REPOSITORY');

export interface ProjectMemberScope extends ProjectScope {
  readonly projectId: string;
}

export interface ProjectMemberRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly userId: string;
  readonly role: ProjectMemberRole;
  readonly allocationPercent: number | null;
  readonly startDate: Date | null;
  readonly status: ProjectMemberStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
  readonly userDisplayName: string | null;
  readonly userEmail: string | null;
  readonly departmentName: string | null;
}

export interface WorkspaceUserOption {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly departmentName: string | null;
}

export interface CreateProjectMemberData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly userId: string;
  readonly role?: ProjectMemberRole;
  readonly allocationPercent?: number | null;
  readonly startDate?: Date | null;
  readonly status?: ProjectMemberStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateProjectMemberData {
  readonly role?: ProjectMemberRole;
  readonly allocationPercent?: number | null;
  readonly startDate?: Date | null;
  readonly status?: ProjectMemberStatus;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteProjectMemberData {
  readonly status: ProjectMemberStatus;
  readonly deletedAt: Date;
  readonly deletedByUserId: string;
  readonly updatedAt: Date;
  readonly updatedByUserId: string;
}

export interface ProjectMemberRepository {
  create(data: CreateProjectMemberData): Promise<ProjectMemberRecord>;
  update(
    scope: ProjectMemberScope,
    id: string,
    data: UpdateProjectMemberData,
  ): Promise<ProjectMemberRecord | null>;
  findById(scope: ProjectMemberScope, id: string): Promise<ProjectMemberRecord | null>;
  findActiveByProjectAndUser(
    scope: ProjectMemberScope,
    userId: string,
    excludeMemberId?: string,
  ): Promise<ProjectMemberRecord | null>;
  findActiveLead(
    scope: ProjectMemberScope,
    excludeMemberId?: string,
  ): Promise<ProjectMemberRecord | null>;
  listByProject(scope: ProjectMemberScope): Promise<readonly ProjectMemberRecord[]>;
  softDelete(
    scope: ProjectMemberScope,
    id: string,
    data: SoftDeleteProjectMemberData,
  ): Promise<ProjectMemberRecord | null>;
  listWorkspaceUsers(scope: ProjectScope): Promise<readonly WorkspaceUserOption[]>;
  isWorkspaceUser(scope: ProjectScope, userId: string): Promise<boolean>;
}
