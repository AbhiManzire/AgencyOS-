import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  IntegrationSyncDirection,
  IntegrationSyncStatus,
  IntegrationSyncTrigger,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { IntegrationScope, IntegrationSyncJobView } from '../domain/integration-domain.types';

@Injectable()
export class SyncQueueService {
  constructor(private readonly prisma: PrismaService) {}

  async enqueue(input: {
    scope: IntegrationScope;
    connectionId: string;
    trigger: IntegrationSyncTrigger;
    direction?: IntegrationSyncDirection;
    scheduledFor?: Date | null;
    config?: Record<string, unknown>;
    actorUserId?: string | null;
  }): Promise<IntegrationSyncJobView> {
    const now = new Date();
    const row = await this.prisma.integrationSyncJob.create({
      data: {
        id: randomUUID(),
        tenantId: input.scope.tenantId,
        workspaceId: input.scope.workspaceId,
        connectionId: input.connectionId,
        trigger: input.trigger,
        direction: input.direction ?? IntegrationSyncDirection.INBOUND,
        status: IntegrationSyncStatus.PENDING,
        scheduledFor: input.scheduledFor ?? now,
        config: (input.config ?? {}) as Prisma.InputJsonValue,
        createdAt: now,
        updatedAt: now,
        createdByUserId: input.actorUserId ?? null,
      },
    });

    return mapSyncJob(row);
  }

  async findDueJobs(now: Date, limit: number): Promise<IntegrationSyncJobView[]> {
    const rows = await this.prisma.integrationSyncJob.findMany({
      where: {
        OR: [
          {
            status: IntegrationSyncStatus.PENDING,
            OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
          },
          {
            status: IntegrationSyncStatus.FAILED,
            nextRetryAt: { lte: now },
          },
        ],
      },
      take: limit * 2,
      orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'asc' }],
    });

    return rows
      .filter((row) => row.attempt < row.maxAttempts)
      .slice(0, limit)
      .map(mapSyncJob);
  }
}

function mapSyncJob(row: {
  id: string;
  tenantId: string;
  workspaceId: string;
  connectionId: string;
  trigger: IntegrationSyncTrigger;
  direction: IntegrationSyncDirection;
  status: IntegrationSyncStatus;
  scheduledFor: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  attempt: number;
  maxAttempts: number;
  nextRetryAt: Date | null;
  errorMessage: string | null;
  config: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): IntegrationSyncJobView {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workspaceId: row.workspaceId,
    connectionId: row.connectionId,
    trigger: row.trigger,
    direction: row.direction,
    status: row.status,
    scheduledFor: row.scheduledFor,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    attempt: row.attempt,
    maxAttempts: row.maxAttempts,
    nextRetryAt: row.nextRetryAt,
    errorMessage: row.errorMessage,
    config: row.config,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
