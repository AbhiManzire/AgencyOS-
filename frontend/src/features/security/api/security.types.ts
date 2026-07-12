export interface SecuritySettings {
  readonly sessionTimeoutMinutes: number;
  readonly passwordMinLength: number;
  readonly passwordRequireUppercase: boolean;
  readonly passwordRequireNumber: boolean;
  readonly passwordRequireSpecial: boolean;
  readonly maxFailedLogins: number;
  readonly lockoutMinutes: number;
}

export type UpdateSecuritySettingsInput = Partial<{
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecial: boolean;
  maxFailedLogins: number;
  lockoutMinutes: number;
}>;

export interface PersonalAccessTokenRecord {
  readonly id: string;
  readonly name: string;
  readonly tokenPrefix: string;
  readonly scopes: readonly string[];
  readonly lastUsedAt: string | null;
  readonly expiresAt: string | null;
  readonly createdAt: string;
}

export interface CreatePersonalAccessTokenInput {
  readonly name: string;
  readonly scopes?: readonly string[];
  readonly expiresAt?: string | null;
}

export interface CreatePersonalAccessTokenResult extends PersonalAccessTokenRecord {
  readonly token: string;
}
