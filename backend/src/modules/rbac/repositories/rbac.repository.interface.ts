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
  findRoleById(tenantId: string, roleId: string): Promise<RoleRecord | null>;
  createCustomRole(entry: {
    readonly id: string;
    readonly tenantId: string;
    readonly name: string;
    readonly slug: string;
    readonly description?: string | null;
    readonly now: Date;
  }): Promise<RoleRecord>;
  updateRole(
    tenantId: string,
    roleId: string,
    patch: {
      readonly name?: string;
      readonly slug?: string;
      readonly description?: string | null;
      readonly now: Date;
    },
  ): Promise<RoleRecord | null>;
  softDeleteRole(tenantId: string, roleId: string, now: Date): Promise<boolean>;
  setRolePermissions(
    tenantId: string,
    roleId: string,
    permissionIds: readonly string[],
    now: Date,
  ): Promise<void>;
  countPermissionIds(permissionIds: readonly string[]): Promise<number>;
  countUsersWithAdminRoles(
    tenantId: string,
    workspaceId: string,
    adminSlugs: readonly string[],
  ): Promise<number>;
  userHasAdminRole(
    tenantId: string,
    userId: string,
    adminSlugs: readonly string[],
  ): Promise<boolean>;
  countUserAdminRoles(
    tenantId: string,
    userId: string,
    adminSlugs: readonly string[],
  ): Promise<number>;
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
