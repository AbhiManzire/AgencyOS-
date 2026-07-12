export interface SecurityScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface SecuritySettings {
  readonly sessionTimeoutMinutes: number;
  readonly passwordMinLength: number;
  readonly passwordRequireUppercase: boolean;
  readonly passwordRequireNumber: boolean;
  readonly passwordRequireSpecial: boolean;
  readonly maxFailedLogins: number;
  readonly lockoutMinutes: number;
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  sessionTimeoutMinutes: 60,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecial: false,
  maxFailedLogins: 5,
  lockoutMinutes: 30,
};

/**
 * Documented keys under workspace.preferencesJson.system
 * (read/written via GET|PATCH /settings/system):
 * - featureFlags: Record<string, boolean>
 * - maintenanceMode: boolean
 * - maxUploadBytes: number
 * - allowedFileTypes: string[]
 * - emailFrom: string
 * - appVersion: string
 */
export interface PersonalAccessTokenRecord {
  readonly id: string;
  readonly name: string;
  readonly tokenPrefix: string;
  readonly scopes: readonly string[];
  readonly lastUsedAt: string | null;
  readonly expiresAt: string | null;
  readonly createdAt: string;
}

export interface CreatedPersonalAccessToken extends PersonalAccessTokenRecord {
  /** Plaintext token returned once at creation. Never persisted. */
  readonly token: string;
}

export interface LockedUserResult {
  readonly userId: string;
  readonly lockedUntil: string;
}

export interface UnlockedUserResult {
  readonly userId: string;
  readonly lockedUntil: null;
}
