import type {
  CompanyProfile,
  SettingsRoleDetail,
  SettingsRoleRecord,
  SettingsScope,
  SettingsUserRecord,
  WorkspacePreferences,
  WorkspaceSettings,
} from '../settings.types';

export const SETTINGS_REPOSITORY = Symbol('SETTINGS_REPOSITORY');

export interface SettingsRepository {
  getCompanyProfile(scope: SettingsScope): Promise<CompanyProfile | null>;
  updateCompanyProfile(
    scope: SettingsScope,
    patch: { name?: string; legalName?: string | null },
  ): Promise<CompanyProfile>;

  getWorkspaceSettings(scope: SettingsScope): Promise<WorkspaceSettings | null>;
  updateWorkspaceSettings(
    scope: SettingsScope,
    patch: { name?: string },
  ): Promise<WorkspaceSettings>;

  getPreferences(scope: SettingsScope): Promise<WorkspacePreferences | null>;
  updatePreferences(
    scope: SettingsScope,
    patch: { timezone?: string; currency?: string },
  ): Promise<WorkspacePreferences>;

  listUsers(scope: SettingsScope): Promise<readonly SettingsUserRecord[]>;
  listRoles(scope: SettingsScope): Promise<readonly SettingsRoleRecord[]>;
  getRoleDetail(scope: SettingsScope, roleId: string): Promise<SettingsRoleDetail | null>;
  roleExists(scope: SettingsScope, roleId: string): Promise<boolean>;
  userInWorkspace(scope: SettingsScope, userId: string): Promise<boolean>;
  assignUserRole(scope: SettingsScope, userId: string, roleId: string): Promise<void>;
  revokeUserRole(scope: SettingsScope, userId: string, roleId: string): Promise<boolean>;
}
