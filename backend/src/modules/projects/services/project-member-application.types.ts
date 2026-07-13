import type { ProjectMemberRole, ProjectMemberStatus } from '@prisma/client';
import type {
  ProjectMemberRecord,
  WorkspaceUserOption,
} from '../repositories/project-member.repository.interface';

export interface ProjectMemberApplicationContext {
  readonly actorUserId: string;
}

export interface CreateProjectMemberCommand {
  readonly userId: string;
  readonly role?: ProjectMemberRole;
  readonly customRoleLabel?: string | null;
  readonly allocationPercent?: number | null;
  readonly startDate?: Date | null;
  readonly status?: ProjectMemberStatus;
}

export interface UpdateProjectMemberCommand {
  readonly role?: ProjectMemberRole;
  readonly customRoleLabel?: string | null;
  readonly allocationPercent?: number | null;
  readonly startDate?: Date | null;
  readonly status?: ProjectMemberStatus;
}

export interface ListProjectMembersResult {
  readonly members: readonly ProjectMemberRecord[];
  readonly availableUsers: readonly WorkspaceUserOption[];
}

export type { ProjectMemberRecord, WorkspaceUserOption };
