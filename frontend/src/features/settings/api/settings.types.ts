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

export type UpdateCompanyProfileInput = Partial<{
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateRegion: string | null;
  postalCode: string | null;
  countryCode: string | null;
  gstin: string | null;
  pan: string | null;
  brandPrimaryColor: string | null;
  brandSecondaryColor: string | null;
}>;

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
  readonly deletedAt: string | null;
}

export type UpdateWorkspaceSettingsInput = Partial<{
  name: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  logoUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateRegion: string | null;
  postalCode: string | null;
  countryCode: string | null;
  gstin: string | null;
  pan: string | null;
  financialYearStartMonth: number;
  businessHoursStart: string;
  businessHoursEnd: string;
  workingDays: readonly number[];
  language: string;
  dateFormat: string;
  numberFormat: string;
}>;

export type PreferencesCategoryMap = Record<string, string | number | boolean | null>;

export interface PreferencesCategories {
  readonly branding?: PreferencesCategoryMap;
  readonly invoice?: PreferencesCategoryMap;
  readonly finance?: PreferencesCategoryMap;
  readonly sales?: PreferencesCategoryMap;
  readonly task?: PreferencesCategoryMap;
  readonly project?: PreferencesCategoryMap;
  readonly notification?: PreferencesCategoryMap;
  readonly email?: PreferencesCategoryMap;
  readonly security?: PreferencesCategoryMap;
  readonly system?: PreferencesCategoryMap;
}

export interface WorkspacePreferences {
  readonly timezone: string;
  readonly currency: string;
  readonly language: string;
  readonly dateFormat: string;
  readonly numberFormat: string;
  readonly financialYearStartMonth: number;
  readonly businessHoursStart: string;
  readonly businessHoursEnd: string;
  readonly workingDays: readonly number[];
  readonly preferencesJson: PreferencesCategories;
}

export type UpdatePreferencesInput = Partial<{
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  numberFormat: string;
  financialYearStartMonth: number;
  businessHoursStart: string;
  businessHoursEnd: string;
  workingDays: readonly number[];
  preferencesJson: PreferencesCategories;
}>;

export interface SystemSettings {
  readonly featureFlags: Record<string, boolean>;
  readonly maintenanceMode: boolean;
  readonly maxUploadBytes: number;
  readonly allowedFileTypes: readonly string[];
  readonly emailFrom: string;
  readonly appVersion: string;
}

export type UpdateSystemSettingsInput = Partial<{
  featureFlags: Record<string, boolean>;
  maintenanceMode: boolean;
  maxUploadBytes: number;
  allowedFileTypes: readonly string[];
  emailFrom: string;
}>;

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
  readonly lastLoginAt: string | null;
  readonly lockedUntil: string | null;
  readonly status: string;
  readonly isActive: boolean;
  readonly roles: readonly SettingsRoleSummary[];
}

export interface ListSettingsUsersParams {
  readonly search?: string;
  readonly status?: string;
  readonly skip?: number;
  readonly take?: number;
  readonly sortBy?: string;
  readonly sortDir?: 'asc' | 'desc';
}

export interface ListSettingsUsersResult {
  readonly items: readonly SettingsUserRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface InviteUserInput {
  readonly email: string;
  readonly roleId?: string;
}

export type UpdateUserProfileInput = Partial<{
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  departmentId: string | null;
  managerUserId: string | null;
}>;

export interface UserInvitationRecord {
  readonly id: string;
  readonly email: string;
  readonly roleId: string | null;
  readonly status: string;
  readonly expiresAt: string;
  readonly createdAt: string;
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

export interface CreateRoleInput {
  readonly name: string;
  readonly slug?: string;
  readonly description?: string | null;
}

export type UpdateRoleInput = Partial<{
  name: string;
  description: string | null;
}>;

export interface SetRolePermissionsInput {
  readonly permissionIds: readonly string[];
}

export interface AdminSummary {
  readonly activeUsers: number;
  readonly workspaceCount: number;
  readonly pendingInvites: number;
  readonly unreadNotifications: number;
  readonly auditEventsLast24h: number;
}

export interface SettingsNavItem {
  readonly title: string;
  readonly href: string;
  readonly description: string;
  readonly permission?: string;
}
