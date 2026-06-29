export interface WorkspacePermissions {
  readonly permissions: readonly string[];
  readonly roles: readonly {
    readonly id: string;
    readonly slug: string;
    readonly name: string;
  }[];
  readonly isSuperAdmin: boolean;
}

export interface PermissionCatalogItem {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  readonly module: string | null;
}

export type PermissionCheckMode = 'hide' | 'disable';

export interface PermissionContextValue {
  readonly permissions: ReadonlySet<string>;
  readonly roles: WorkspacePermissions['roles'];
  readonly isSuperAdmin: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly hasPermission: (permissionKey: string) => boolean;
  readonly hasAllPermissions: (permissionKeys: readonly string[]) => boolean;
}
