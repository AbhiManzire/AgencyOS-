import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { FeatureFlag } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { AiScope, FeatureFlagRecord } from '../ai.types';
import { AiAuditService } from './ai-audit.service';

@Injectable()
export class FeatureFlagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiAudit: AiAuditService,
  ) {}

  async list(
    scope: AiScope,
    skip: number,
    take: number,
  ): Promise<{ items: readonly FeatureFlagRecord[]; total: number }> {
    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
    };

    const [rows, total] = await Promise.all([
      this.prisma.featureFlag.findMany({
        where,
        orderBy: { key: 'asc' },
        skip,
        take,
      }),
      this.prisma.featureFlag.count({ where }),
    ]);

    return { items: rows.map((row) => this.toRecord(row)), total };
  }

  async getByKey(scope: AiScope, key: string): Promise<FeatureFlagRecord> {
    const row = await this.prisma.featureFlag.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        key,
        deletedAt: null,
      },
    });

    if (row === null) {
      throw new NotFoundException(`Feature flag "${key}" not found.`);
    }

    return this.toRecord(row);
  }

  async upsert(
    scope: AiScope,
    key: string,
    input: {
      name: string;
      description: string | null;
      enabled: boolean;
    },
    actorUserId: string | null,
  ): Promise<FeatureFlagRecord> {
    const trimmedKey = key.trim();
    if (trimmedKey === '') {
      throw new BadRequestException('Feature flag key is required.');
    }

    const now = new Date();
    const existing = await this.prisma.featureFlag.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        key: trimmedKey,
        deletedAt: null,
      },
    });

    const row =
      existing === null
        ? await this.prisma.featureFlag.create({
            data: {
              id: randomUUID(),
              tenantId: scope.tenantId,
              workspaceId: scope.workspaceId,
              key: trimmedKey,
              name: input.name.trim(),
              description: input.description,
              enabled: input.enabled,
              createdAt: now,
              updatedAt: now,
            },
          })
        : await this.prisma.featureFlag.update({
            where: { id: existing.id },
            data: {
              name: input.name.trim(),
              description: input.description,
              enabled: input.enabled,
              updatedAt: now,
            },
          });

    await this.aiAudit.write(scope, {
      actorUserId,
      entityType: 'FeatureFlag',
      entityId: row.id,
      summary: `${existing === null ? 'Created' : 'Updated'} feature flag "${trimmedKey}".`,
      metadata: { key: trimmedKey, enabled: input.enabled },
    });

    return this.toRecord(row);
  }

  async isEnabled(scope: AiScope, key: string): Promise<boolean> {
    const row = await this.prisma.featureFlag.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        key,
        deletedAt: null,
      },
      select: { enabled: true },
    });

    return row?.enabled ?? false;
  }

  private toRecord(row: FeatureFlag): FeatureFlagRecord {
    return {
      id: row.id,
      key: row.key,
      name: row.name,
      description: row.description,
      enabled: row.enabled,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
