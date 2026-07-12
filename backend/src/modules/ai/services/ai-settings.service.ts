import { BadRequestException, Injectable } from '@nestjs/common';
import type { AiSettings } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { AiScope, AiSettingsRecord } from '../ai.types';
import type { UpdateAiSettingsDto } from '../dto/update-ai-settings.dto';
import { AiAuditService } from './ai-audit.service';

@Injectable()
export class AiSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiAudit: AiAuditService,
  ) {}

  async getOrCreate(scope: AiScope): Promise<AiSettingsRecord> {
    const existing = await this.prisma.aiSettings.findUnique({
      where: {
        tenantId_workspaceId: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
        },
      },
    });

    if (existing !== null) {
      return this.toRecord(existing);
    }

    const now = new Date();
    const created = await this.prisma.aiSettings.create({
      data: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.toRecord(created);
  }

  async update(
    scope: AiScope,
    dto: UpdateAiSettingsDto,
    actorUserId: string | null,
  ): Promise<AiSettingsRecord> {
    this.assertHasPatch(dto);
    await this.getOrCreate(scope);

    const now = new Date();
    const updated = await this.prisma.aiSettings.update({
      where: {
        tenantId_workspaceId: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
        },
      },
      data: {
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
        ...(dto.defaultProviderKind !== undefined
          ? { defaultProviderKind: dto.defaultProviderKind }
          : {}),
        ...(dto.defaultModel !== undefined ? { defaultModel: dto.defaultModel } : {}),
        ...(dto.maxTokensPerRequest !== undefined
          ? { maxTokensPerRequest: dto.maxTokensPerRequest }
          : {}),
        ...(dto.monthlyTokenBudget !== undefined
          ? { monthlyTokenBudget: dto.monthlyTokenBudget }
          : {}),
        ...(dto.auditPrompts !== undefined ? { auditPrompts: dto.auditPrompts } : {}),
        updatedAt: now,
      },
    });

    await this.aiAudit.write(scope, {
      actorUserId,
      entityType: 'AiSettings',
      entityId: updated.id,
      summary: 'Updated workspace AI settings.',
      metadata: { patch: dto } as unknown as import('@prisma/client').Prisma.InputJsonValue,
    });

    return this.toRecord(updated);
  }

  private assertHasPatch(dto: object): void {
    const keys = Object.keys(dto).filter(
      (key) => (dto as Record<string, unknown>)[key] !== undefined,
    );
    if (keys.length === 0) {
      throw new BadRequestException('At least one field is required.');
    }
  }

  private toRecord(row: AiSettings): AiSettingsRecord {
    return {
      id: row.id,
      enabled: row.enabled,
      defaultProviderKind: row.defaultProviderKind,
      defaultModel: row.defaultModel,
      maxTokensPerRequest: row.maxTokensPerRequest,
      monthlyTokenBudget: row.monthlyTokenBudget,
      auditPrompts: row.auditPrompts,
      preferences: row.preferences,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
