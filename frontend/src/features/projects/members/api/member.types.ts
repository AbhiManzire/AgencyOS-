import type { ProjectMemberRole, ProjectMemberStatus } from '@/features/projects/types';

export interface ProjectMemberRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly userId: string;
  readonly role: ProjectMemberRole;
  readonly customRoleLabel?: string | null;
  readonly allocationPercent: number | null;
  readonly startDate: string | null;
  readonly status: ProjectMemberStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
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

export interface ListProjectMembersResult {
  readonly members: readonly ProjectMemberRecord[];
  readonly availableUsers: readonly WorkspaceUserOption[];
}

export interface CreateProjectMemberPayload {
  readonly userId: string;
  readonly role?: ProjectMemberRole;
  readonly customRoleLabel?: string | null;
  readonly allocationPercent?: number | null;
  readonly startDate?: string;
  readonly status?: ProjectMemberStatus;
}

export interface UpdateProjectMemberPayload {
  readonly role?: ProjectMemberRole;
  readonly customRoleLabel?: string | null;
  readonly allocationPercent?: number | null;
  readonly startDate?: string | null;
  readonly status?: ProjectMemberStatus;
}
