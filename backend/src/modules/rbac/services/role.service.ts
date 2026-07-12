import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ADMIN_ROLE_SLUGS } from '../rbac.constants';
import { RBAC_REPOSITORY, type RbacRepository } from '../repositories/rbac.repository.interface';
import type { PermissionCatalogEntry, RoleRecord } from '../rbac.types';

@Injectable()
export class RoleService {
  constructor(
    @Inject(RBAC_REPOSITORY)
    private readonly rbacRepository: RbacRepository,
  ) {}

  async listRoles(tenantId: string): Promise<readonly RoleRecord[]> {
    return this.rbacRepository.listRoles(tenantId);
  }

  async listPermissionCatalog(): Promise<readonly PermissionCatalogEntry[]> {
    return this.rbacRepository.listPermissionCatalog();
  }

  async getRole(tenantId: string, roleId: string): Promise<RoleRecord> {
    const role = await this.rbacRepository.findRoleById(tenantId, roleId);
    if (!role) {
      throw new NotFoundException('Role not found.');
    }
    return role;
  }

  async createCustomRole(
    tenantId: string,
    input: { name: string; description?: string | null },
  ): Promise<RoleRecord> {
    const name = input.name.trim();
    const slug = slugifyRoleName(name);
    if (slug.length === 0) {
      throw new BadRequestException('Role name must produce a valid slug.');
    }

    const existing = (await this.rbacRepository.listRoles(tenantId)).find(
      (role) => role.slug === slug,
    );
    if (existing) {
      throw new ConflictException(`Role slug "${slug}" already exists.`);
    }

    return this.rbacRepository.createCustomRole({
      id: randomUUID(),
      tenantId,
      name,
      slug,
      description: input.description ?? null,
      now: new Date(),
    });
  }

  async updateRole(
    tenantId: string,
    roleId: string,
    input: { name?: string; description?: string | null },
  ): Promise<RoleRecord> {
    const role = await this.getRole(tenantId, roleId);
    const now = new Date();

    let nextName = role.name;
    let nextSlug: string | undefined;

    if (input.name !== undefined) {
      nextName = input.name.trim();
      if (nextName.length === 0) {
        throw new BadRequestException('Role name cannot be empty.');
      }

      if (!role.isSystem) {
        nextSlug = slugifyRoleName(nextName);
        if (nextSlug.length === 0) {
          throw new BadRequestException('Role name must produce a valid slug.');
        }

        const conflict = (await this.rbacRepository.listRoles(tenantId)).find(
          (entry) => entry.slug === nextSlug && entry.id !== roleId,
        );
        if (conflict) {
          throw new ConflictException(`Role slug "${nextSlug}" already exists.`);
        }
      }
    }

    const updated = await this.rbacRepository.updateRole(tenantId, roleId, {
      name: input.name !== undefined ? nextName : undefined,
      slug: nextSlug,
      description: input.description,
      now,
    });

    if (!updated) {
      throw new NotFoundException('Role not found.');
    }

    return updated;
  }

  async softDeleteRole(tenantId: string, roleId: string): Promise<void> {
    const role = await this.getRole(tenantId, roleId);
    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted.');
    }

    const deleted = await this.rbacRepository.softDeleteRole(tenantId, roleId, new Date());
    if (!deleted) {
      throw new NotFoundException('Role not found.');
    }
  }

  async setRolePermissions(
    tenantId: string,
    roleId: string,
    permissionIds: readonly string[],
  ): Promise<void> {
    await this.getRole(tenantId, roleId);

    const uniqueIds = [...new Set(permissionIds)];
    const count = await this.rbacRepository.countPermissionIds(uniqueIds);
    if (count !== uniqueIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid.');
    }

    await this.rbacRepository.setRolePermissions(tenantId, roleId, uniqueIds, new Date());
  }

  async assertCanRevokeRole(
    tenantId: string,
    workspaceId: string,
    userId: string,
    roleId: string,
  ): Promise<void> {
    const role = await this.getRole(tenantId, roleId);
    const isAdminRole = (ADMIN_ROLE_SLUGS as readonly string[]).includes(role.slug);
    if (!isAdminRole) {
      return;
    }

    const userAdminRoleCount = await this.rbacRepository.countUserAdminRoles(
      tenantId,
      userId,
      ADMIN_ROLE_SLUGS,
    );
    if (userAdminRoleCount > 1) {
      return;
    }

    const adminCount = await this.rbacRepository.countUsersWithAdminRoles(
      tenantId,
      workspaceId,
      ADMIN_ROLE_SLUGS,
    );

    if (adminCount <= 1) {
      throw new BadRequestException(
        'Cannot revoke the last Founder/Admin/Super Admin role from the last remaining admin user.',
      );
    }
  }
}

function slugifyRoleName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
