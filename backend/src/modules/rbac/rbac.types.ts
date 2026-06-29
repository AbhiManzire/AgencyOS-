export interface RbacScope {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly userId: string;
}

export interface ResolvedRoleSummary {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
}

export interface ResolvedPermissionContext {
  readonly scope: RbacScope;
  readonly permissions: readonly string[];
  readonly roles: readonly ResolvedRoleSummary[];
  readonly isSuperAdmin: boolean;
}

export interface PermissionCatalogEntry {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  readonly module: string | null;
}

export interface RoleRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly isSystem: boolean;
}
