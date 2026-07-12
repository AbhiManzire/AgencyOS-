import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { PermissionCatalogEntry, ResolvedRoleSummary, RoleRecord } from '../rbac.types';
import type { RbacRepository } from './rbac.repository.interface';

@Injectable()
export class PrismaRbacRepository implements RbacRepository {
  constructor(private readonly prisma: PrismaService) {}

  async workspaceBelongsToTenant(tenantId: string, workspaceId: string): Promise<boolean> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return workspace !== null;
  }

  async listActivePermissionKeys(): Promise<readonly string[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { deletedAt: null },
      select: { key: true },
      orderBy: { key: 'asc' },
    });

    return permissions.map((permission) => permission.key);
  }

  async listPermissionCatalog(): Promise<readonly PermissionCatalogEntry[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { deletedAt: null },
      orderBy: { key: 'asc' },
    });

    return permissions.map((permission) => ({
      id: permission.id,
      key: permission.key,
      name: permission.name,
      description: permission.description,
      module: permission.module,
    }));
  }

  async findUserRoles(
    scope: Pick<import('../rbac.types').RbacScope, 'tenantId' | 'userId'>,
  ): Promise<readonly ResolvedRoleSummary[]> {
    const assignments = await this.prisma.userRole.findMany({
      where: {
        tenantId: scope.tenantId,
        userId: scope.userId,
        deletedAt: null,
        role: {
          deletedAt: null,
        },
      },
      include: {
        role: true,
      },
    });

    return assignments.map((assignment) => ({
      id: assignment.role.id,
      slug: assignment.role.slug,
      name: assignment.role.name,
    }));
  }

  async findPermissionKeysForRoles(
    tenantId: string,
    roleIds: readonly string[],
  ): Promise<readonly string[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        tenantId,
        roleId: { in: [...roleIds] },
        permission: { deletedAt: null },
      },
      include: {
        permission: true,
      },
    });

    return [...new Set(rolePermissions.map((entry) => entry.permission.key))].sort();
  }

  async listRoles(tenantId: string): Promise<readonly RoleRecord[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    return roles.map(toRoleRecord);
  }

  async findRoleById(tenantId: string, roleId: string): Promise<RoleRecord | null> {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId,
        deletedAt: null,
      },
    });

    return role ? toRoleRecord(role) : null;
  }

  async createCustomRole(entry: {
    readonly id: string;
    readonly tenantId: string;
    readonly name: string;
    readonly slug: string;
    readonly description?: string | null;
    readonly now: Date;
  }): Promise<RoleRecord> {
    const role = await this.prisma.role.create({
      data: {
        id: entry.id,
        tenantId: entry.tenantId,
        name: entry.name,
        slug: entry.slug,
        description: entry.description ?? null,
        isSystem: false,
        createdAt: entry.now,
        updatedAt: entry.now,
      },
    });

    return toRoleRecord(role);
  }

  async updateRole(
    tenantId: string,
    roleId: string,
    patch: {
      readonly name?: string;
      readonly slug?: string;
      readonly description?: string | null;
      readonly now: Date;
    },
  ): Promise<RoleRecord | null> {
    const existing = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const role = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        updatedAt: patch.now,
      },
    });

    return toRoleRecord(role);
  }

  async softDeleteRole(tenantId: string, roleId: string, now: Date): Promise<boolean> {
    const existing = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        deletedAt: now,
        updatedAt: now,
      },
    });

    return true;
  }

  async setRolePermissions(
    tenantId: string,
    roleId: string,
    permissionIds: readonly string[],
    now: Date,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { tenantId, roleId },
      });

      if (permissionIds.length === 0) {
        return;
      }

      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          id: randomUUID(),
          tenantId,
          roleId,
          permissionId,
          createdAt: now,
        })),
      });
    });
  }

  async countPermissionIds(permissionIds: readonly string[]): Promise<number> {
    if (permissionIds.length === 0) {
      return 0;
    }

    return this.prisma.permission.count({
      where: {
        id: { in: [...permissionIds] },
        deletedAt: null,
      },
    });
  }

  async countUsersWithAdminRoles(
    tenantId: string,
    workspaceId: string,
    adminSlugs: readonly string[],
  ): Promise<number> {
    if (adminSlugs.length === 0) {
      return 0;
    }

    const assignments = await this.prisma.userRole.findMany({
      where: {
        tenantId,
        deletedAt: null,
        role: {
          tenantId,
          deletedAt: null,
          slug: { in: [...adminSlugs] },
        },
        user: {
          deletedAt: null,
          isActive: true,
          employees: {
            some: {
              tenantId,
              workspaceId,
              deletedAt: null,
              isActive: true,
            },
          },
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return assignments.length;
  }

  async userHasAdminRole(
    tenantId: string,
    userId: string,
    adminSlugs: readonly string[],
  ): Promise<boolean> {
    const count = await this.countUserAdminRoles(tenantId, userId, adminSlugs);
    return count > 0;
  }

  async countUserAdminRoles(
    tenantId: string,
    userId: string,
    adminSlugs: readonly string[],
  ): Promise<number> {
    if (adminSlugs.length === 0) {
      return 0;
    }

    return this.prisma.userRole.count({
      where: {
        tenantId,
        userId,
        deletedAt: null,
        role: {
          tenantId,
          deletedAt: null,
          slug: { in: [...adminSlugs] },
        },
      },
    });
  }

  async upsertPermissionCatalogEntry(entry: {
    readonly id: string;
    readonly key: string;
    readonly name: string;
    readonly description?: string;
    readonly module?: string;
    readonly now: Date;
  }): Promise<void> {
    await this.prisma.permission.upsert({
      where: { key: entry.key },
      create: {
        id: entry.id,
        key: entry.key,
        name: entry.name,
        description: entry.description ?? null,
        module: entry.module ?? null,
        createdAt: entry.now,
        updatedAt: entry.now,
      },
      update: {
        name: entry.name,
        description: entry.description ?? null,
        module: entry.module ?? null,
        updatedAt: entry.now,
        deletedAt: null,
        deletedByUserId: null,
      },
    });
  }

  async upsertSystemRole(entry: {
    readonly id: string;
    readonly tenantId: string;
    readonly name: string;
    readonly slug: string;
    readonly description?: string;
    readonly now: Date;
  }): Promise<RoleRecord> {
    const role = await this.prisma.role.upsert({
      where: {
        tenantId_slug: {
          tenantId: entry.tenantId,
          slug: entry.slug,
        },
      },
      create: {
        id: entry.id,
        tenantId: entry.tenantId,
        name: entry.name,
        slug: entry.slug,
        description: entry.description ?? null,
        isSystem: true,
        createdAt: entry.now,
        updatedAt: entry.now,
      },
      update: {
        name: entry.name,
        description: entry.description ?? null,
        isSystem: true,
        updatedAt: entry.now,
        deletedAt: null,
        deletedByUserId: null,
      },
    });

    return toRoleRecord(role);
  }

  async ensureRolePermission(
    tenantId: string,
    roleId: string,
    permissionId: string,
    now: Date,
  ): Promise<void> {
    await this.prisma.rolePermission.upsert({
      where: {
        tenantId_roleId_permissionId: {
          tenantId,
          roleId,
          permissionId,
        },
      },
      create: {
        id: randomUUID(),
        tenantId,
        roleId,
        permissionId,
        createdAt: now,
      },
      update: {},
    });
  }

  async ensureUserRoleAssignment(
    tenantId: string,
    userId: string,
    roleId: string,
    now: Date,
  ): Promise<void> {
    await this.prisma.userRole.upsert({
      where: {
        tenantId_userId_roleId: {
          tenantId,
          userId,
          roleId,
        },
      },
      create: {
        id: randomUUID(),
        tenantId,
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
}

function toRoleRecord(role: {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
}): RoleRecord {
  return {
    id: role.id,
    tenantId: role.tenantId,
    name: role.name,
    slug: role.slug,
    description: role.description,
    isSystem: role.isSystem,
  };
}
