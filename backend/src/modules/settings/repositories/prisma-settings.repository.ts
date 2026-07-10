import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CompanyProfile,
  SettingsRoleDetail,
  SettingsRoleRecord,
  SettingsScope,
  SettingsUserRecord,
  WorkspacePreferences,
  WorkspaceSettings,
} from '../settings.types';
import type { SettingsRepository } from './settings.repository.interface';

@Injectable()
export class PrismaSettingsRepository implements SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyProfile(scope: SettingsScope): Promise<CompanyProfile | null> {
    const workspace = await this.findWorkspace(scope);
    if (!workspace) {
      return null;
    }

    return {
      agencyId: workspace.agency.id,
      name: workspace.agency.name,
      slug: workspace.agency.slug,
      legalName: workspace.agency.legalName,
    };
  }

  async updateCompanyProfile(
    scope: SettingsScope,
    patch: { name?: string; legalName?: string | null },
  ): Promise<CompanyProfile> {
    const workspace = await this.findWorkspace(scope);
    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    const agency = await this.prisma.agency.update({
      where: { id: workspace.agency.id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.legalName !== undefined ? { legalName: patch.legalName } : {}),
        updatedAt: new Date(),
      },
    });

    return {
      agencyId: agency.id,
      name: agency.name,
      slug: agency.slug,
      legalName: agency.legalName,
    };
  }

  async getWorkspaceSettings(scope: SettingsScope): Promise<WorkspaceSettings | null> {
    const workspace = await this.findWorkspace(scope);
    if (!workspace) {
      return null;
    }

    return toWorkspaceSettings(workspace);
  }

  async updateWorkspaceSettings(
    scope: SettingsScope,
    patch: { name?: string },
  ): Promise<WorkspaceSettings> {
    const existing = await this.findWorkspace(scope);
    if (!existing) {
      throw new NotFoundException('Workspace not found.');
    }

    const workspace = await this.prisma.workspace.update({
      where: { id: existing.id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        updatedAt: new Date(),
      },
      include: { agency: true },
    });

    return toWorkspaceSettings(workspace);
  }

  async getPreferences(scope: SettingsScope): Promise<WorkspacePreferences | null> {
    const workspace = await this.findWorkspace(scope);
    if (!workspace) {
      return null;
    }

    return {
      timezone: workspace.timezone,
      currency: workspace.currency,
    };
  }

  async updatePreferences(
    scope: SettingsScope,
    patch: { timezone?: string; currency?: string },
  ): Promise<WorkspacePreferences> {
    const existing = await this.findWorkspace(scope);
    if (!existing) {
      throw new NotFoundException('Workspace not found.');
    }

    const workspace = await this.prisma.workspace.update({
      where: { id: existing.id },
      data: {
        ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {}),
        ...(patch.currency !== undefined ? { currency: patch.currency.toUpperCase() } : {}),
        updatedAt: new Date(),
      },
    });

    return {
      timezone: workspace.timezone,
      currency: workspace.currency,
    };
  }

  async listUsers(scope: SettingsScope): Promise<readonly SettingsUserRecord[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            isActive: true,
            deletedAt: true,
          },
        },
      },
      orderBy: {
        user: { email: 'asc' },
      },
    });

    const userIds = employees.map((employee) => employee.userId);
    const assignments =
      userIds.length === 0
        ? []
        : await this.prisma.userRole.findMany({
            where: {
              tenantId: scope.tenantId,
              userId: { in: userIds },
              deletedAt: null,
              role: { deletedAt: null },
            },
            include: {
              role: {
                select: { id: true, name: true, slug: true },
              },
            },
          });

    const rolesByUser = new Map<string, SettingsUserRecord['roles'][number][]>();
    for (const assignment of assignments) {
      const list = rolesByUser.get(assignment.userId) ?? [];
      list.push({
        id: assignment.role.id,
        name: assignment.role.name,
        slug: assignment.role.slug,
      });
      rolesByUser.set(assignment.userId, list);
    }

    return employees
      .filter((employee) => employee.user.deletedAt === null)
      .map((employee) => ({
        userId: employee.user.id,
        email: employee.user.email,
        displayName: resolveDisplayName(employee.user),
        firstName: employee.user.firstName,
        lastName: employee.user.lastName,
        jobTitle: employee.jobTitle,
        status: employee.status,
        isActive: employee.isActive && employee.user.isActive,
        roles: rolesByUser.get(employee.user.id) ?? [],
      }));
  }

  async listRoles(scope: SettingsScope): Promise<readonly SettingsRoleRecord[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        tenantId: scope.tenantId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { rolePermissions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      permissionCount: role._count.rolePermissions,
    }));
  }

  async getRoleDetail(scope: SettingsScope, roleId: string): Promise<SettingsRoleDetail | null> {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId: scope.tenantId,
        deletedAt: null,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
          orderBy: {
            permission: { key: 'asc' },
          },
        },
      },
    });

    if (!role) {
      return null;
    }

    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.rolePermissions
        .filter((entry) => entry.permission.deletedAt === null)
        .map((entry) => ({
          id: entry.permission.id,
          key: entry.permission.key,
          name: entry.permission.name,
          description: entry.permission.description,
          module: entry.permission.module,
        })),
    };
  }

  async roleExists(scope: SettingsScope, roleId: string): Promise<boolean> {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId: scope.tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return role !== null;
  }

  async userInWorkspace(scope: SettingsScope, userId: string): Promise<boolean> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return employee !== null;
  }

  async assignUserRole(scope: SettingsScope, userId: string, roleId: string): Promise<void> {
    const now = new Date();
    await this.prisma.userRole.upsert({
      where: {
        tenantId_userId_roleId: {
          tenantId: scope.tenantId,
          userId,
          roleId,
        },
      },
      create: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        userId,
        roleId,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        deletedAt: null,
        deletedByUserId: null,
        updatedAt: now,
      },
    });
  }

  async revokeUserRole(scope: SettingsScope, userId: string, roleId: string): Promise<boolean> {
    const existing = await this.prisma.userRole.findFirst({
      where: {
        tenantId: scope.tenantId,
        userId,
        roleId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await this.prisma.userRole.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return true;
  }

  private async findWorkspace(scope: SettingsScope) {
    return this.prisma.workspace.findFirst({
      where: {
        id: scope.workspaceId,
        tenantId: scope.tenantId,
        deletedAt: null,
      },
      include: {
        agency: true,
      },
    });
  }
}

function toWorkspaceSettings(workspace: {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  isActive: boolean;
}): WorkspaceSettings {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    timezone: workspace.timezone,
    currency: workspace.currency,
    isActive: workspace.isActive,
  };
}

function resolveDisplayName(user: {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  if (user.displayName && user.displayName.trim().length > 0) {
    return user.displayName;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName.length > 0 ? fullName : user.email;
}
