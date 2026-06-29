import { Inject, Injectable } from '@nestjs/common';
import type { RbacConfiguration } from '../rbac.configuration';
import { RBAC_CONFIGURATION } from '../rbac.configuration';
import {
  RBAC_REPOSITORY,
  type RbacRepository,
  type ResolvedPermissionContext,
} from '../repositories/rbac.repository.interface';
import type { RbacScope } from '../rbac.types';

@Injectable()
export class PermissionService {
  constructor(
    @Inject(RBAC_REPOSITORY)
    private readonly rbacRepository: RbacRepository,
    @Inject(RBAC_CONFIGURATION)
    private readonly rbacConfiguration: RbacConfiguration,
  ) {}

  async resolvePermissionContext(scope: RbacScope): Promise<ResolvedPermissionContext> {
    if (!this.rbacConfiguration.enforced) {
      const permissions = await this.rbacRepository.listActivePermissionKeys();

      return {
        scope,
        permissions,
        roles: [],
        isSuperAdmin: true,
      };
    }

    const workspaceValid = await this.rbacRepository.workspaceBelongsToTenant(
      scope.tenantId,
      scope.workspaceId,
    );

    if (!workspaceValid) {
      return this.emptyContext(scope);
    }

    const roles = await this.rbacRepository.findUserRoles(scope);
    const isSuperAdmin = roles.some(
      (role) => role.slug === this.rbacConfiguration.superAdminRoleSlug,
    );

    if (isSuperAdmin) {
      const permissions = await this.rbacRepository.listActivePermissionKeys();

      return {
        scope,
        permissions,
        roles,
        isSuperAdmin: true,
      };
    }

    const permissions = await this.rbacRepository.findPermissionKeysForRoles(
      scope.tenantId,
      roles.map((role) => role.id),
    );

    return {
      scope,
      permissions,
      roles,
      isSuperAdmin: false,
    };
  }

  hasPermission(context: ResolvedPermissionContext, permissionKey: string): boolean {
    if (context.isSuperAdmin) {
      return true;
    }

    return context.permissions.includes(permissionKey);
  }

  hasAllPermissions(
    context: ResolvedPermissionContext,
    permissionKeys: readonly string[],
  ): boolean {
    if (context.isSuperAdmin) {
      return true;
    }

    return permissionKeys.every((key) => context.permissions.includes(key));
  }

  private emptyContext(scope: RbacScope): ResolvedPermissionContext {
    return {
      scope,
      permissions: [],
      roles: [],
      isSuperAdmin: false,
    };
  }
}
