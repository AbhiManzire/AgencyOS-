import { Injectable } from '@nestjs/common';
import type { ProjectMilestone, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProjectScope } from './project.repository.interface';
import type {
  CreateProjectMilestoneData,
  ProjectMilestoneRecord,
  ProjectMilestoneRepository,
  ProjectMilestoneScope,
  SoftDeleteProjectMilestoneData,
  UpdateProjectMilestoneData,
} from './project-milestone.repository.interface';
import type { WorkspaceUserOption } from './project-member.repository.interface';

type ProjectMilestoneWithOwner = ProjectMilestone & {
  ownerUser: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'> | null;
  blockedByDeps?: readonly { dependsOnMilestoneId: string }[];
};

const ownerInclude = {
  ownerUser: {
    select: {
      displayName: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
  blockedByDeps: {
    select: { dependsOnMilestoneId: true },
  },
} as const;

@Injectable()
export class PrismaProjectMilestoneRepository implements ProjectMilestoneRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProjectMilestoneData): Promise<ProjectMilestoneRecord> {
    const milestone = await this.prisma.projectMilestone.create({ data });
    const enriched = await this.findById(
      { tenantId: data.tenantId, workspaceId: data.workspaceId, projectId: data.projectId },
      milestone.id,
    );

    if (enriched === null) {
      throw new Error('Failed to load created project milestone.');
    }

    return enriched;
  }

  async update(
    scope: ProjectMilestoneScope,
    id: string,
    data: UpdateProjectMilestoneData,
  ): Promise<ProjectMilestoneRecord | null> {
    const result = await this.prisma.projectMilestone.updateMany({
      where: activeMilestoneWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async findById(scope: ProjectMilestoneScope, id: string): Promise<ProjectMilestoneRecord | null> {
    const milestone = await this.prisma.projectMilestone.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        deletedAt: null,
      },
      include: ownerInclude,
    });

    if (milestone === null) {
      return null;
    }

    return toProjectMilestoneRecord(milestone);
  }

  async listByProject(scope: ProjectMilestoneScope): Promise<readonly ProjectMilestoneRecord[]> {
    const milestones = await this.prisma.projectMilestone.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        deletedAt: null,
      },
      include: ownerInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return milestones.map(toProjectMilestoneRecord);
  }

  async getNextSortOrder(scope: ProjectMilestoneScope): Promise<number> {
    const aggregate = await this.prisma.projectMilestone.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        deletedAt: null,
      },
      _max: { sortOrder: true },
    });

    return (aggregate._max.sortOrder ?? -1) + 1;
  }

  async softDelete(
    scope: ProjectMilestoneScope,
    id: string,
    data: SoftDeleteProjectMilestoneData,
  ): Promise<ProjectMilestoneRecord | null> {
    const result = await this.prisma.projectMilestone.updateMany({
      where: activeMilestoneWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const milestone = await this.prisma.projectMilestone.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
      },
      include: ownerInclude,
    });

    if (milestone === null) {
      return null;
    }

    return toProjectMilestoneRecord(milestone);
  }

  async listWorkspaceUsers(scope: ProjectScope): Promise<readonly WorkspaceUserOption[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          email: 'asc',
        },
      },
    });

    return employees.map((employee) => ({
      id: employee.user.id,
      displayName: resolveUserDisplayName(employee.user),
      email: employee.user.email,
      departmentName: employee.department?.name ?? null,
    }));
  }

  async isWorkspaceUser(scope: ProjectScope, userId: string): Promise<boolean> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });

    return employee !== null;
  }
}

function activeMilestoneWhere(scope: ProjectMilestoneScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    deletedAt: null,
  };
}

function resolveUserDisplayName(
  user: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>,
): string {
  if (user.displayName !== null && user.displayName.trim().length > 0) {
    return user.displayName.trim();
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name.length > 0 ? name : user.email;
}

function toProjectMilestoneRecord(milestone: ProjectMilestoneWithOwner): ProjectMilestoneRecord {
  const completionPercent = milestone.status === 'COMPLETED' ? 100 : milestone.completionPercent;
  return {
    id: milestone.id,
    tenantId: milestone.tenantId,
    workspaceId: milestone.workspaceId,
    projectId: milestone.projectId,
    name: milestone.name,
    description: milestone.description,
    status: milestone.status,
    startDate: milestone.startDate,
    dueDate: milestone.dueDate,
    ownerUserId: milestone.ownerUserId,
    completionPercent,
    sortOrder: milestone.sortOrder,
    completedAt: milestone.completedAt,
    progressPercent: completionPercent,
    dependsOnMilestoneIds: (milestone.blockedByDeps ?? []).map((d) => d.dependsOnMilestoneId),
    createdAt: milestone.createdAt,
    updatedAt: milestone.updatedAt,
    createdByUserId: milestone.createdByUserId,
    updatedByUserId: milestone.updatedByUserId,
    deletedAt: milestone.deletedAt,
    deletedByUserId: milestone.deletedByUserId,
    ownerDisplayName:
      milestone.ownerUser === null ? null : resolveUserDisplayName(milestone.ownerUser),
    ownerEmail: milestone.ownerUser?.email ?? null,
  };
}
