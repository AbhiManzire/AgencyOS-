import type { ProjectMilestoneStatus } from '@prisma/client';
import type { ProjectMilestoneRecord } from '../repositories/project-milestone.repository.interface';
import type { WorkspaceUserOption } from '../repositories/project-member.repository.interface';

export interface ProjectMilestoneApplicationContext {
  readonly actorUserId: string;
}

export interface CreateProjectMilestoneCommand {
  readonly name: string;
  readonly description?: string | null;
  readonly status?: ProjectMilestoneStatus;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly ownerUserId?: string | null;
}

export interface UpdateProjectMilestoneCommand {
  readonly name?: string;
  readonly description?: string | null;
  readonly status?: ProjectMilestoneStatus;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly ownerUserId?: string | null;
}

export interface ListProjectMilestonesResult {
  readonly milestones: readonly ProjectMilestoneRecord[];
  readonly availableOwners: readonly WorkspaceUserOption[];
}

export type { ProjectMilestoneRecord, WorkspaceUserOption };
