import { Injectable } from '@nestjs/common';
import type { AiProviderKind } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { AiScope, AiUsageSummary } from '../ai.types';

export interface RecordUsageInput {
  readonly conversationId?: string | null;
  readonly actorUserId?: string | null;
  readonly providerKind: AiProviderKind;
  readonly model?: string | null;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  readonly estimatedCostUsd?: number | null;
  readonly featureKey?: string | null;
  readonly metadata?: import('@prisma/client').Prisma.InputJsonValue;
  readonly occurredAt?: Date;
}

@Injectable()
export class TokenUsageService {
  constructor(private readonly prisma: PrismaService) {}

  async recordUsage(scope: AiScope, input: RecordUsageInput): Promise<void> {
    const now = new Date();
    await this.prisma.aiUsageEvent.create({
      data: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        conversationId: input.conversationId ?? null,
        actorUserId: input.actorUserId ?? null,
        providerKind: input.providerKind,
        model: input.model ?? null,
        promptTokens: input.promptTokens,
        completionTokens: input.completionTokens,
        totalTokens: input.totalTokens,
        estimatedCostUsd: input.estimatedCostUsd ?? null,
        featureKey: input.featureKey ?? null,
        metadata: input.metadata ?? undefined,
        occurredAt: input.occurredAt ?? now,
        createdAt: now,
      },
    });
  }

  async summarizeUsage(
    scope: AiScope,
    from: Date | undefined,
    to: Date | undefined,
  ): Promise<AiUsageSummary> {
    const occurredAtFilter =
      from !== undefined || to !== undefined
        ? {
            ...(from !== undefined ? { gte: from } : {}),
            ...(to !== undefined ? { lte: to } : {}),
          }
        : undefined;

    const aggregate = await this.prisma.aiUsageEvent.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(occurredAtFilter !== undefined ? { occurredAt: occurredAtFilter } : {}),
      },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
      },
      _count: { _all: true },
    });

    return {
      promptTokens: aggregate._sum.promptTokens ?? 0,
      completionTokens: aggregate._sum.completionTokens ?? 0,
      totalTokens: aggregate._sum.totalTokens ?? 0,
      eventCount: aggregate._count._all,
    };
  }
}
