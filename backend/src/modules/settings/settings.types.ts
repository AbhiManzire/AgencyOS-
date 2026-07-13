export interface SettingsScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface PreferenceCategories {
  readonly branding?: Record<string, unknown>;
  readonly invoice?: Record<string, unknown>;
  readonly finance?: Record<string, unknown>;
  readonly sales?: Record<string, unknown>;
  readonly task?: Record<string, unknown>;
  readonly project?: Record<string, unknown>;
  readonly notification?: Record<string, unknown>;
  readonly email?: Record<string, unknown>;
  readonly security?: Record<string, unknown>;
  readonly system?: Record<string, unknown>;
}

export interface CompanyProfile {
  readonly agencyId: string;
  readonly name: string;
  readonly slug: string;
  readonly legalName: string | null;
  readonly logoUrl: string | null;
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly city: string | null;
  readonly stateRegion: string | null;
  readonly postalCode: string | null;
  readonly countryCode: string | null;
  readonly gstin: string | null;
  readonly pan: string | null;
  readonly brandPrimaryColor: string | null;
  readonly brandSecondaryColor: string | null;
}

export interface WorkspaceSettings {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly timezone: string;
  readonly currency: string;
  readonly isActive: boolean;
  readonly logoUrl: string | null;
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly city: string | null;
  readonly stateRegion: string | null;
  readonly postalCode: string | null;
  readonly countryCode: string | null;
  readonly gstin: string | null;
  readonly pan: string | null;
  readonly financialYearStartMonth: number;
  readonly businessHoursStart: string;
  readonly businessHoursEnd: string;
  readonly workingDays: readonly number[];
  readonly language: string;
  readonly dateFormat: string;
  readonly numberFormat: string;
  readonly preferencesJson: PreferenceCategories;
}

export interface WorkspacePreferences {
  readonly timezone: string;
  readonly currency: string;
  readonly language: string;
  readonly dateFormat: string;
  readonly numberFormat: string;
  readonly workingDays: readonly number[];
  readonly businessHoursStart: string;
  readonly businessHoursEnd: string;
  readonly financialYearStartMonth: number;
  readonly preferencesJson: PreferenceCategories;
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
  readonly designation: string | null;
  readonly avatarUrl: string | null;
  readonly departmentId: string | null;
  readonly departmentName: string | null;
  readonly managerUserId: string | null;
  readonly managerName: string | null;
  readonly lastLoginAt: Date | null;
  readonly lockedUntil: Date | null;
  readonly status: string;
  readonly isActive: boolean;
  readonly roles: readonly SettingsRoleSummary[];
}

export interface SettingsUserListResult {
  readonly items: readonly SettingsUserRecord[];
  readonly total: number;
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

export interface SettingsRoleDetail extends Omit<SettingsRoleRecord, 'permissionCount'> {
  readonly permissions: readonly SettingsRolePermission[];
}

export interface SettingsInvitationRecord {
  readonly id: string;
  readonly email: string;
  readonly roleId: string | null;
  readonly status: string;
  readonly expiresAt: Date;
  readonly emailReady: true;
}

export interface AcceptInvitationResult {
  readonly userId: string;
  readonly email: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly createdUser: boolean;
}

export interface SettingsEmailReadyResult {
  readonly emailReady: true;
  readonly messageId: string;
}

export type SettingsUserSortField =
  'email' | 'displayName' | 'status' | 'jobTitle' | 'lastLoginAt' | 'createdAt';

export type SettingsSortDir = 'asc' | 'desc';

export interface ListSettingsUsersQuery {
  readonly search?: string;
  readonly status?: string;
  readonly skip?: number;
  readonly take?: number;
  readonly sortBy?: SettingsUserSortField;
  readonly sortDir?: SettingsSortDir;
}

export interface SystemPreferences {
  readonly featureFlags: Readonly<Record<string, boolean>>;
  readonly maintenanceMode: boolean;
  readonly maxUploadBytes: number;
  readonly allowedFileTypes: readonly string[];
  readonly emailFrom: string;
  readonly appVersion: string;
}

export const DEFAULT_SYSTEM_PREFERENCES: SystemPreferences = {
  featureFlags: {},
  maintenanceMode: false,
  maxUploadBytes: 10 * 1024 * 1024,
  allowedFileTypes: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'csv', 'xlsx', 'docx'],
  emailFrom: 'noreply@agencyos.local',
  appVersion: '0.1.0',
};
