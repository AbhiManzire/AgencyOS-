import { Injectable, NotFoundException } from '@nestjs/common';
import type { AiProviderConfig, AiProviderKind } from '@prisma/client';
import { type Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { AiScope, AiProviderConfigRecord } from '../ai.types';
import type {
  CreateAiProviderConfigDto,
  UpdateAiProviderConfigDto,
} from '../dto/ai-provider-config.dto';
import { AiAuditService } from './ai-audit.service';

@Injectable()
export class AiProviderConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiAudit: AiAuditService,
  ) {}

  async list(scope: AiScope): Promise<readonly AiProviderConfigRecord[]> {
    const rows = await this.prisma.aiProviderConfig.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return rows.map((row) => this.toRecord(row));
  }

  async create(
    scope: AiScope,
    dto: CreateAiProviderConfigDto,
    actorUserId: string | null,
  ): Promise<AiProviderConfigRecord> {
    const now = new Date();
    const isDefault = dto.isDefault ?? false;

    if (isDefault) {
      await this.clearDefaultProvider(scope, now);
    }

    const row = await this.prisma.aiProviderConfig.create({
      data: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        kind: dto.kind,
        name: dto.name.trim(),
        isDefault,
        isEnabled: dto.isEnabled ?? false,
        baseUrl: dto.baseUrl ?? null,
        model: dto.model ?? null,
        apiKeyEnvRef: dto.apiKeyEnvRef ?? null,
        encryptedApiKey: dto.encryptedApiKey ?? null,
        config: dto.config ?? {},
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.aiAudit.write(scope, {
      actorUserId,
      entityType: 'AiProviderConfig',
      entityId: row.id,
      summary: `Created AI provider config "${row.name}".`,
      metadata: { kind: row.kind, isDefault: row.isDefault },
    });

    return this.toRecord(row);
  }

  async update(
    scope: AiScope,
    id: string,
    dto: UpdateAiProviderConfigDto,
    actorUserId: string | null,
  ): Promise<AiProviderConfigRecord> {
    const existing = await this.findScopedConfig(scope, id);
    const now = new Date();

    if (dto.isDefault === true) {
      await this.clearDefaultProvider(scope, now);
    }

    const row = await this.prisma.aiProviderConfig.update({
      where: { id: existing.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
        ...(dto.baseUrl !== undefined ? { baseUrl: dto.baseUrl } : {}),
        ...(dto.model !== undefined ? { model: dto.model } : {}),
        ...(dto.apiKeyEnvRef !== undefined ? { apiKeyEnvRef: dto.apiKeyEnvRef } : {}),
        ...(dto.encryptedApiKey !== undefined ? { encryptedApiKey: dto.encryptedApiKey } : {}),
        ...(dto.config !== undefined ? { config: dto.config } : {}),
        updatedAt: now,
      },
    });

    await this.aiAudit.write(scope, {
      actorUserId,
      entityType: 'AiProviderConfig',
      entityId: row.id,
      summary: `Updated AI provider config "${row.name}".`,
      metadata: { patch: this.sanitizePatch(dto) } as unknown as Prisma.InputJsonValue,
    });

    return this.toRecord(row);
  }

  async getDefaultProviderKind(scope: AiScope): Promise<AiProviderKind | null> {
    const row = await this.prisma.aiProviderConfig.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        isDefault: true,
        isEnabled: true,
        deletedAt: null,
      },
      select: { kind: true },
    });

    return row?.kind ?? null;
  }

  private async findScopedConfig(scope: AiScope, id: string): Promise<AiProviderConfig> {
    const row = await this.prisma.aiProviderConfig.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    if (row === null) {
      throw new NotFoundException('AI provider config not found.');
    }

    return row;
  }

  private async clearDefaultProvider(scope: AiScope, updatedAt: Date): Promise<void> {
    await this.prisma.aiProviderConfig.updateMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        isDefault: true,
        deletedAt: null,
      },
      data: { isDefault: false, updatedAt },
    });
  }

  private sanitizePatch(dto: UpdateAiProviderConfigDto): Record<string, unknown> {
    const patch: Record<string, unknown> = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
      ...(dto.baseUrl !== undefined ? { baseUrl: dto.baseUrl } : {}),
      ...(dto.model !== undefined ? { model: dto.model } : {}),
      ...(dto.apiKeyEnvRef !== undefined ? { apiKeyEnvRef: dto.apiKeyEnvRef } : {}),
      ...(dto.config !== undefined ? { config: dto.config } : {}),
    };
    if (dto.encryptedApiKey !== undefined) {
      patch.hasEncryptedApiKey = dto.encryptedApiKey !== null && dto.encryptedApiKey.length > 0;
    }
    return patch;
  }

  private toRecord(row: AiProviderConfig): AiProviderConfigRecord {
    return {
      id: row.id,
      kind: row.kind,
      name: row.name,
      isDefault: row.isDefault,
      isEnabled: row.isEnabled,
      baseUrl: row.baseUrl,
      model: row.model,
      apiKeyEnvRef: row.apiKeyEnvRef,
      hasEncryptedApiKey: row.encryptedApiKey !== null && row.encryptedApiKey.length > 0,
      config: row.config,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
