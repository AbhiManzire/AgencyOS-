import { Injectable, NotFoundException } from '@nestjs/common';
import type { PersonalAccessToken, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_SECURITY_SETTINGS,
  type PersonalAccessTokenRecord,
  type SecurityScope,
  type SecuritySettings,
} from '../security.types';
import type { CreatePatData, SecurityRepository } from './security.repository.interface';

@Injectable()
export class PrismaSecurityRepository implements SecurityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSecuritySettings(scope: SecurityScope): Promise<SecuritySettings> {
    const workspace = await this.findWorkspace(scope);
    if (workspace === null) {
      throw new NotFoundException('Workspace not found.');
    }

    return mergeSecuritySettings(readPreferencesObject(workspace.preferencesJson).security);
  }

  async updateSecuritySettings(
    scope: SecurityScope,
    patch: Partial<SecuritySettings>,
  ): Promise<SecuritySettings> {
    const workspace = await this.findWorkspace(scope);
    if (workspace === null) {
      throw new NotFoundException('Workspace not found.');
    }

    const preferences = readPreferencesObject(workspace.preferencesJson);
    const nextSecurity = mergeSecuritySettings({
      ...asRecord(preferences.security),
      ...patch,
    });

    const nextPreferences: Record<string, unknown> = {
      ...preferences,
      security: nextSecurity,
    };

    await this.prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        preferencesJson: nextPreferences as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    return nextSecurity;
  }

  async listTokens(
    scope: SecurityScope,
    userId: string,
  ): Promise<readonly PersonalAccessTokenRecord[]> {
    const rows = await this.prisma.personalAccessToken.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        deletedAt: null,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(toTokenRecord);
  }

  async createToken(scope: SecurityScope, data: CreatePatData): Promise<PersonalAccessTokenRecord> {
    const created = await this.prisma.personalAccessToken.create({
      data: {
        id: data.id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId: data.userId,
        name: data.name,
        tokenPrefix: data.tokenPrefix,
        tokenHash: data.tokenHash,
        scopes: [...data.scopes],
        expiresAt: data.expiresAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });

    return toTokenRecord(created);
  }

  async revokeToken(
    scope: SecurityScope,
    userId: string,
    tokenId: string,
    revokedAt: Date,
  ): Promise<PersonalAccessTokenRecord | null> {
    const existing = await this.prisma.personalAccessToken.findFirst({
      where: {
        id: tokenId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        deletedAt: null,
        revokedAt: null,
      },
    });

    if (existing === null) {
      return null;
    }

    const updated = await this.prisma.personalAccessToken.update({
      where: { id: tokenId },
      data: {
        revokedAt,
        updatedAt: revokedAt,
      },
    });

    return toTokenRecord(updated);
  }

  async userInWorkspace(scope: SecurityScope, userId: string): Promise<boolean> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return employee !== null;
  }

  async lockUser(
    userId: string,
    lockedUntil: Date,
  ): Promise<{ userId: string; lockedUntil: Date }> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil,
        updatedAt: new Date(),
      },
      select: { id: true, lockedUntil: true },
    });

    return {
      userId: updated.id,
      lockedUntil: updated.lockedUntil ?? lockedUntil,
    };
  }

  async unlockUser(userId: string): Promise<{ userId: string; lockedUntil: null }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        failedLoginCount: 0,
        updatedAt: new Date(),
      },
    });

    return { userId, lockedUntil: null };
  }

  private async findWorkspace(scope: SecurityScope) {
    return this.prisma.workspace.findFirst({
      where: {
        id: scope.workspaceId,
        tenantId: scope.tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        preferencesJson: true,
      },
    });
  }
}

function toTokenRecord(row: PersonalAccessToken): PersonalAccessTokenRecord {
  return {
    id: row.id,
    name: row.name,
    tokenPrefix: row.tokenPrefix,
    scopes: row.scopes,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function readPreferencesObject(value: Prisma.JsonValue): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function mergeSecuritySettings(raw: unknown): SecuritySettings {
  const source = asRecord(raw);

  return {
    sessionTimeoutMinutes: readPositiveInt(
      source.sessionTimeoutMinutes,
      DEFAULT_SECURITY_SETTINGS.sessionTimeoutMinutes,
    ),
    passwordMinLength: readPositiveInt(
      source.passwordMinLength,
      DEFAULT_SECURITY_SETTINGS.passwordMinLength,
    ),
    passwordRequireUppercase: readBoolean(
      source.passwordRequireUppercase,
      DEFAULT_SECURITY_SETTINGS.passwordRequireUppercase,
    ),
    passwordRequireNumber: readBoolean(
      source.passwordRequireNumber,
      DEFAULT_SECURITY_SETTINGS.passwordRequireNumber,
    ),
    passwordRequireSpecial: readBoolean(
      source.passwordRequireSpecial,
      DEFAULT_SECURITY_SETTINGS.passwordRequireSpecial,
    ),
    maxFailedLogins: readPositiveInt(
      source.maxFailedLogins,
      DEFAULT_SECURITY_SETTINGS.maxFailedLogins,
    ),
    lockoutMinutes: readPositiveInt(
      source.lockoutMinutes,
      DEFAULT_SECURITY_SETTINGS.lockoutMinutes,
    ),
  };
}

function readPositiveInt(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
