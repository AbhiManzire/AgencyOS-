import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, type Prisma } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { AuditWriterService } from '../../audit/services/audit-writer.service';
import type { CreatePersonalAccessTokenDto } from '../dto/create-personal-access-token.dto';
import type { UpdateSecuritySettingsDto } from '../dto/update-security-settings.dto';
import {
  SECURITY_REPOSITORY,
  type SecurityRepository,
} from '../repositories/security.repository.interface';
import type {
  CreatedPersonalAccessToken,
  LockedUserResult,
  PersonalAccessTokenRecord,
  SecurityScope,
  SecuritySettings,
  UnlockedUserResult,
} from '../security.types';

@Injectable()
export class SecurityService {
  constructor(
    @Inject(SECURITY_REPOSITORY)
    private readonly securityRepository: SecurityRepository,
    private readonly auditWriter: AuditWriterService,
  ) {}

  async getSettings(scope: SecurityScope): Promise<SecuritySettings> {
    return this.securityRepository.getSecuritySettings(scope);
  }

  async updateSettings(
    scope: SecurityScope,
    dto: UpdateSecuritySettingsDto,
    actorUserId: string | null,
  ): Promise<SecuritySettings> {
    this.assertHasPatch(dto);
    const updated = await this.securityRepository.updateSecuritySettings(scope, {
      ...(dto.sessionTimeoutMinutes !== undefined
        ? { sessionTimeoutMinutes: dto.sessionTimeoutMinutes }
        : {}),
      ...(dto.passwordMinLength !== undefined ? { passwordMinLength: dto.passwordMinLength } : {}),
      ...(dto.passwordRequireUppercase !== undefined
        ? { passwordRequireUppercase: dto.passwordRequireUppercase }
        : {}),
      ...(dto.passwordRequireNumber !== undefined
        ? { passwordRequireNumber: dto.passwordRequireNumber }
        : {}),
      ...(dto.passwordRequireSpecial !== undefined
        ? { passwordRequireSpecial: dto.passwordRequireSpecial }
        : {}),
      ...(dto.maxFailedLogins !== undefined ? { maxFailedLogins: dto.maxFailedLogins } : {}),
      ...(dto.lockoutMinutes !== undefined ? { lockoutMinutes: dto.lockoutMinutes } : {}),
    });

    await this.auditWriter.write(scope, {
      actorUserId,
      action: AuditAction.SECURITY_CHANGE,
      category: 'security',
      entityType: 'Workspace',
      entityId: scope.workspaceId,
      summary: 'Updated workspace security settings.',
      metadata: { patch: dto } as unknown as Prisma.InputJsonValue,
    });

    return updated;
  }

  async listTokens(
    scope: SecurityScope,
    userId: string,
  ): Promise<readonly PersonalAccessTokenRecord[]> {
    return this.securityRepository.listTokens(scope, userId);
  }

  async createToken(
    scope: SecurityScope,
    userId: string,
    dto: CreatePersonalAccessTokenDto,
  ): Promise<CreatedPersonalAccessToken> {
    const now = new Date();
    const plaintext = `aos_${randomBytes(32).toString('base64url')}`;
    const tokenHash = createHash('sha256').update(plaintext).digest('hex');
    const tokenPrefix = plaintext.slice(0, 12);
    const scopes = (dto.scopes ?? []).map((scopeKey) => scopeKey.trim()).filter(Boolean);

    const record = await this.securityRepository.createToken(scope, {
      id: randomUUID(),
      userId,
      name: dto.name.trim(),
      tokenPrefix,
      tokenHash,
      scopes,
      expiresAt: dto.expiresAt !== undefined ? new Date(dto.expiresAt) : null,
      createdAt: now,
      updatedAt: now,
    });

    await this.auditWriter.write(scope, {
      actorUserId: userId,
      action: AuditAction.SECURITY_CHANGE,
      category: 'security',
      entityType: 'PersonalAccessToken',
      entityId: record.id,
      summary: `Created personal access token "${record.name}".`,
      metadata: { tokenPrefix: record.tokenPrefix, scopes: record.scopes },
    });

    return { ...record, token: plaintext };
  }

  async revokeToken(
    scope: SecurityScope,
    userId: string,
    tokenId: string,
  ): Promise<PersonalAccessTokenRecord> {
    const revoked = await this.securityRepository.revokeToken(scope, userId, tokenId, new Date());
    if (revoked === null) {
      throw new NotFoundException('Personal access token not found.');
    }

    await this.auditWriter.write(scope, {
      actorUserId: userId,
      action: AuditAction.SECURITY_CHANGE,
      category: 'security',
      entityType: 'PersonalAccessToken',
      entityId: tokenId,
      summary: `Revoked personal access token "${revoked.name}".`,
      metadata: { tokenPrefix: revoked.tokenPrefix },
    });

    return revoked;
  }

  async lockUser(
    scope: SecurityScope,
    targetUserId: string,
    actorUserId: string | null,
  ): Promise<LockedUserResult> {
    const inWorkspace = await this.securityRepository.userInWorkspace(scope, targetUserId);
    if (!inWorkspace) {
      throw new NotFoundException('User not found in this workspace.');
    }

    const settings = await this.securityRepository.getSecuritySettings(scope);
    const lockedUntil = new Date(Date.now() + settings.lockoutMinutes * 60_000);
    const result = await this.securityRepository.lockUser(targetUserId, lockedUntil);

    await this.auditWriter.write(scope, {
      actorUserId,
      action: AuditAction.SECURITY_CHANGE,
      category: 'security',
      entityType: 'User',
      entityId: targetUserId,
      summary: 'Locked user account.',
      metadata: { lockedUntil: result.lockedUntil.toISOString() },
    });

    return {
      userId: result.userId,
      lockedUntil: result.lockedUntil.toISOString(),
    };
  }

  async unlockUser(
    scope: SecurityScope,
    targetUserId: string,
    actorUserId: string | null,
  ): Promise<UnlockedUserResult> {
    const inWorkspace = await this.securityRepository.userInWorkspace(scope, targetUserId);
    if (!inWorkspace) {
      throw new NotFoundException('User not found in this workspace.');
    }

    const result = await this.securityRepository.unlockUser(targetUserId);

    await this.auditWriter.write(scope, {
      actorUserId,
      action: AuditAction.SECURITY_CHANGE,
      category: 'security',
      entityType: 'User',
      entityId: targetUserId,
      summary: 'Unlocked user account.',
    });

    return result;
  }

  private assertHasPatch(dto: object): void {
    const keys = Object.keys(dto).filter(
      (key) => (dto as Record<string, unknown>)[key] !== undefined,
    );
    if (keys.length === 0) {
      throw new BadRequestException('At least one field is required.');
    }
  }
}
