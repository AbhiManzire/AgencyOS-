import { Injectable } from '@nestjs/common';
import type { ProjectMember, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProjectScope } from './project.repository.interface';
import type {
  CreateProjectMemberData,
  ProjectMemberRecord,
  ProjectMemberRepository,
  ProjectMemberScope,
  SoftDeleteProjectMemberData,
  UpdateProjectMemberData,
  WorkspaceUserOption,
} from './project-member.repository.interface';

type ProjectMemberWithUser = ProjectMember & {
  user: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>;
};

@Injectable()
export class PrismaProjectMemberRepository implements ProjectMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProjectMemberData): Promise<ProjectMemberRecord> {
    const member = await this.prisma.projectMember.create({ data });
    const enriched = await this.findById(
      { tenantId: data.tenantId, workspaceId: data.workspaceId, projectId: data.projectId },
      member.id,
    );

    if (enriched === null) {
      throw new Error('Failed to load created project member.');
    }

    return enriched;
  }

  async update(
    scope: ProjectMemberScope,
    id: string,
    data: UpdateProjectMemberData,
  ): Promise<ProjectMemberRecord | null> {
    const result = await this.prisma.projectMember.updateMany({
      where: activeMemberWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async findById(scope: ProjectMemberScope, id: string): Promise<ProjectMemberRecord | null> {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (member === null) {
      return null;
    }

    const departmentName = await this.resolveDepartmentName(scope, member.userId);
    return toProjectMemberRecord(member, departmentName);
  }

  async findActiveByProjectAndUser(
    scope: ProjectMemberScope,
    userId: string,
    excludeMemberId?: string,
  ): Promise<ProjectMemberRecord | null> {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        userId,
        deletedAt: null,
        ...(excludeMemberId !== undefined ? { id: { not: excludeMemberId } } : {}),
      },
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (member === null) {
      return null;
    }

    const departmentName = await this.resolveDepartmentName(scope, member.userId);
    return toProjectMemberRecord(member, departmentName);
  }

  async findActiveManager(
    scope: ProjectMemberScope,
    excludeMemberId?: string,
  ): Promise<ProjectMemberRecord | null> {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        role: 'MANAGER',
        deletedAt: null,
        ...(excludeMemberId !== undefined ? { id: { not: excludeMemberId } } : {}),
      },
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (member === null) {
      return null;
    }

    const departmentName = await this.resolveDepartmentName(scope, member.userId);
    return toProjectMemberRecord(member, departmentName);
  }

  async listByProject(scope: ProjectMemberScope): Promise<readonly ProjectMemberRecord[]> {
    const members = await this.prisma.projectMember.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    if (members.length === 0) {
      return [];
    }

    const userIds = [...new Set(members.map((member) => member.userId))];
    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId: { in: userIds },
        deletedAt: null,
      },
      include: {
        department: {
          select: { name: true },
        },
      },
    });

    const departmentByUserId = new Map<string, string | null>();
    for (const employee of employees) {
      if (!departmentByUserId.has(employee.userId)) {
        departmentByUserId.set(employee.userId, employee.department?.name ?? null);
      }
    }

    return members.map((member) =>
      toProjectMemberRecord(member, departmentByUserId.get(member.userId) ?? null),
    );
  }

  async softDelete(
    scope: ProjectMemberScope,
    id: string,
    data: SoftDeleteProjectMemberData,
  ): Promise<ProjectMemberRecord | null> {
    const result = await this.prisma.projectMember.updateMany({
      where: activeMemberWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const member = await this.prisma.projectMember.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
      },
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (member === null) {
      return null;
    }

    const departmentName = await this.resolveDepartmentName(scope, member.userId);
    return toProjectMemberRecord(member, departmentName);
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

  private async resolveDepartmentName(
    scope: ProjectMemberScope,
    userId: string,
  ): Promise<string | null> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        deletedAt: null,
      },
      include: {
        department: {
          select: { name: true },
        },
      },
    });

    return employee?.department?.name ?? null;
  }
}

function activeMemberWhere(scope: ProjectMemberScope, id: string) {
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

function toProjectMemberRecord(
  member: ProjectMemberWithUser,
  departmentName: string | null,
): ProjectMemberRecord {
  return {
    id: member.id,
    tenantId: member.tenantId,
    workspaceId: member.workspaceId,
    projectId: member.projectId,
    userId: member.userId,
    role: member.role,
    customRoleLabel: member.customRoleLabel,
    allocationPercent: member.allocationPercent,
    startDate: member.startDate,
    status: member.status,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    createdByUserId: member.createdByUserId,
    updatedByUserId: member.updatedByUserId,
    deletedAt: member.deletedAt,
    deletedByUserId: member.deletedByUserId,
    userDisplayName: resolveUserDisplayName(member.user),
    userEmail: member.user.email,
    departmentName,
  };
}
