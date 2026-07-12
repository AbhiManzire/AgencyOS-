import type {
  CreatedPersonalAccessToken,
  PersonalAccessTokenRecord,
  SecurityScope,
  SecuritySettings,
} from '../security.types';

export const SECURITY_REPOSITORY = Symbol('SECURITY_REPOSITORY');

export interface CreatePatData {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly tokenPrefix: string;
  readonly tokenHash: string;
  readonly scopes: readonly string[];
  readonly expiresAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SecurityRepository {
  getSecuritySettings(scope: SecurityScope): Promise<SecuritySettings>;
  updateSecuritySettings(
    scope: SecurityScope,
    patch: Partial<SecuritySettings>,
  ): Promise<SecuritySettings>;

  listTokens(scope: SecurityScope, userId: string): Promise<readonly PersonalAccessTokenRecord[]>;
  createToken(scope: SecurityScope, data: CreatePatData): Promise<PersonalAccessTokenRecord>;
  revokeToken(
    scope: SecurityScope,
    userId: string,
    tokenId: string,
    revokedAt: Date,
  ): Promise<PersonalAccessTokenRecord | null>;

  userInWorkspace(scope: SecurityScope, userId: string): Promise<boolean>;
  lockUser(userId: string, lockedUntil: Date): Promise<{ userId: string; lockedUntil: Date }>;
  unlockUser(userId: string): Promise<{ userId: string; lockedUntil: null }>;
}

export type { CreatedPersonalAccessToken };
