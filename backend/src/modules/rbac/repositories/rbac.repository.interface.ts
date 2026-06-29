import type {
  PermissionCatalogEntry,
  RbacScope,
  ResolvedPermissionContext,
  ResolvedRoleSummary,
  RoleRecord,
} from '../rbac.types';

export const RBAC_REPOSITORY = Symbol('RBAC_REPOSITORY');

export interface RbacRepository {
  workspaceBelongsToTenant(tenantId: string, workspaceId: string): Promise<boolean>;
  listActivePermissionKeys(): Promise<readonly string[]>;
  listPermissionCatalog(): Promise<readonly PermissionCatalogEntry[]>;
  findUserRoles(
    scope: Pick<RbacScope, 'tenantId' | 'userId'>,
  ): Promise<readonly ResolvedRoleSummary[]>;
  findPermissionKeysForRoles(
    tenantId: string,
    roleIds: readonly string[],
  ): Promise<readonly string[]>;
  listRoles(tenantId: string): Promise<readonly RoleRecord[]>;
  upsertPermissionCatalogEntry(entry: {
    readonly id: string;
    readonly key: string;
    readonly name: string;
    readonly description?: string;
    readonly module?: string;
    readonly now: Date;
  }): Promise<void>;
  upsertSystemRole(entry: {
    readonly id: string;
    readonly tenantId: string;
    readonly name: string;
    readonly slug: string;
    readonly description?: string;
    readonly now: Date;
  }): Promise<RoleRecord>;
  ensureRolePermission(
    tenantId: string,
    roleId: string,
    permissionId: string,
    now: Date,
  ): Promise<void>;
  ensureUserRoleAssignment(
    tenantId: string,
    userId: string,
    roleId: string,
    now: Date,
  ): Promise<void>;
}

export type { ResolvedPermissionContext };
