import type {
  CompanyProfile,
  ListSettingsUsersQuery,
  PreferenceCategories,
  SettingsInvitationRecord,
  SettingsRoleDetail,
  SettingsRoleRecord,
  SettingsScope,
  SettingsUserListResult,
  SettingsUserRecord,
  SystemPreferences,
  WorkspacePreferences,
  WorkspaceSettings,
} from '../settings.types';

export const SETTINGS_REPOSITORY = Symbol('SETTINGS_REPOSITORY');

export interface CompanyProfilePatch {
  readonly name?: string;
  readonly legalName?: string | null;
  readonly logoUrl?: string | null;
  readonly addressLine1?: string | null;
  readonly addressLine2?: string | null;
  readonly city?: string | null;
  readonly stateRegion?: string | null;
  readonly postalCode?: string | null;
  readonly countryCode?: string | null;
  readonly gstin?: string | null;
  readonly pan?: string | null;
  readonly brandPrimaryColor?: string | null;
  readonly brandSecondaryColor?: string | null;
}

export interface WorkspaceSettingsPatch {
  readonly name?: string;
  readonly isActive?: boolean;
  readonly logoUrl?: string | null;
  readonly addressLine1?: string | null;
  readonly addressLine2?: string | null;
  readonly city?: string | null;
  readonly stateRegion?: string | null;
  readonly postalCode?: string | null;
  readonly countryCode?: string | null;
  readonly gstin?: string | null;
  readonly pan?: string | null;
  readonly timezone?: string;
  readonly currency?: string;
  readonly language?: string;
  readonly dateFormat?: string;
  readonly numberFormat?: string;
  readonly financialYearStartMonth?: number;
  readonly businessHoursStart?: string;
  readonly businessHoursEnd?: string;
  readonly workingDays?: readonly number[];
}

export interface WorkspacePreferencesPatch {
  readonly timezone?: string;
  readonly currency?: string;
  readonly language?: string;
  readonly dateFormat?: string;
  readonly numberFormat?: string;
  readonly workingDays?: readonly number[];
  readonly businessHoursStart?: string;
  readonly businessHoursEnd?: string;
  readonly financialYearStartMonth?: number;
  readonly preferencesJson?: PreferenceCategories;
}

export interface UserProfilePatch {
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly displayName?: string | null;
  readonly avatarUrl?: string | null;
  readonly jobTitle?: string | null;
  readonly departmentId?: string | null;
  readonly managerUserId?: string | null;
}

export interface CreateInvitationInput {
  readonly id: string;
  readonly email: string;
  readonly roleId?: string;
  readonly invitedByUserId?: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly now: Date;
}

export interface SettingsRepository {
  getCompanyProfile(scope: SettingsScope): Promise<CompanyProfile | null>;
  updateCompanyProfile(scope: SettingsScope, patch: CompanyProfilePatch): Promise<CompanyProfile>;

  getWorkspaceSettings(scope: SettingsScope): Promise<WorkspaceSettings | null>;
  updateWorkspaceSettings(
    scope: SettingsScope,
    patch: WorkspaceSettingsPatch,
  ): Promise<WorkspaceSettings>;
  archiveWorkspace(scope: SettingsScope, now: Date): Promise<WorkspaceSettings>;
  restoreWorkspace(scope: SettingsScope, now: Date): Promise<WorkspaceSettings>;

  getPreferences(scope: SettingsScope): Promise<WorkspacePreferences | null>;
  updatePreferences(
    scope: SettingsScope,
    patch: WorkspacePreferencesPatch,
  ): Promise<WorkspacePreferences>;

  getSystemPreferences(scope: SettingsScope): Promise<SystemPreferences | null>;
  updateSystemPreferences(
    scope: SettingsScope,
    patch: Partial<SystemPreferences>,
  ): Promise<SystemPreferences>;

  listUsers(scope: SettingsScope, query?: ListSettingsUsersQuery): Promise<SettingsUserListResult>;
  getUser(scope: SettingsScope, userId: string): Promise<SettingsUserRecord | null>;
  updateUserProfile(
    scope: SettingsScope,
    userId: string,
    patch: UserProfilePatch,
  ): Promise<SettingsUserRecord>;
  deactivateUser(scope: SettingsScope, userId: string, now: Date): Promise<SettingsUserRecord>;
  reactivateUser(scope: SettingsScope, userId: string, now: Date): Promise<SettingsUserRecord>;
  archiveUser(scope: SettingsScope, userId: string, now: Date): Promise<SettingsUserRecord>;
  restoreUser(scope: SettingsScope, userId: string, now: Date): Promise<SettingsUserRecord>;
  unlockUser(scope: SettingsScope, userId: string, now: Date): Promise<SettingsUserRecord>;

  findPendingInvitationByEmail(scope: SettingsScope, email: string): Promise<{ id: string } | null>;
  findPendingInvitationByTokenHash(tokenHash: string): Promise<{
    readonly id: string;
    readonly tenantId: string;
    readonly workspaceId: string;
    readonly email: string;
    readonly roleId: string | null;
    readonly expiresAt: Date;
  } | null>;
  createInvitation(
    scope: SettingsScope,
    input: CreateInvitationInput,
  ): Promise<SettingsInvitationRecord>;
  acceptInvitation(input: {
    readonly invitationId: string;
    readonly userId: string;
    readonly tenantId: string;
    readonly workspaceId: string;
    readonly roleId: string | null;
    readonly email: string;
    readonly firstName?: string | null;
    readonly lastName?: string | null;
    readonly displayName?: string | null;
    readonly keycloakSubject: string;
    readonly now: Date;
  }): Promise<{ readonly userId: string; readonly createdUser: boolean }>;
  findUserByEmail(email: string): Promise<{
    readonly id: string;
    readonly email: string;
    readonly isActive: boolean;
  } | null>;

  listRoles(scope: SettingsScope): Promise<readonly SettingsRoleRecord[]>;
  getRoleDetail(scope: SettingsScope, roleId: string): Promise<SettingsRoleDetail | null>;
  roleExists(scope: SettingsScope, roleId: string): Promise<boolean>;
  userInWorkspace(scope: SettingsScope, userId: string): Promise<boolean>;
  userInWorkspaceIncludingArchived(scope: SettingsScope, userId: string): Promise<boolean>;
  findUserIdByEmailInWorkspace(scope: SettingsScope, email: string): Promise<string | null>;
  assignUserRole(scope: SettingsScope, userId: string, roleId: string): Promise<void>;
  revokeUserRole(scope: SettingsScope, userId: string, roleId: string): Promise<boolean>;
  departmentExists(scope: SettingsScope, departmentId: string): Promise<boolean>;
}
