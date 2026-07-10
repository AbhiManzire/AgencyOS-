export interface CompanyProfile {
  readonly agencyId: string;
  readonly name: string;
  readonly slug: string;
  readonly legalName: string | null;
}

export interface WorkspaceSettings {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly timezone: string;
  readonly currency: string;
  readonly isActive: boolean;
}

export interface WorkspacePreferences {
  readonly timezone: string;
  readonly currency: string;
}

export interface SettingsRoleSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface SettingsUserRecord {
  readonly userId: string;
  readonly email: string;
  readonly displayName: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly jobTitle: string | null;
  readonly status: string;
  readonly isActive: boolean;
  readonly roles: readonly SettingsRoleSummary[];
}

export interface SettingsRoleRecord {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly isSystem: boolean;
  readonly permissionCount: number;
}

export interface SettingsRolePermission {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  readonly module: string | null;
}

export interface SettingsRoleDetail {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly isSystem: boolean;
  readonly permissions: readonly SettingsRolePermission[];
}

export interface SettingsNavItem {
  readonly title: string;
  readonly href: string;
  readonly description: string;
  readonly permission?: string;
}
