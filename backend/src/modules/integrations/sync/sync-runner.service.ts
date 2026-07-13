import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { IntegrationConnectionStatus, IntegrationSyncStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdaptersRegistry } from '../adapters/adapters.registry';
import { summarizePayload } from '../adapters/base.adapter';
import type { AdapterContext } from '../adapters/integration-adapter.interface';
import { CredentialStoreService } from '../credentials/credential-store.service';
import type { IntegrationSyncJobView } from '../domain/integration-domain.types';

const RETRY_BASE_MS = 60_000;

@Injectable()
export class SyncRunnerService {
  private readonly logger = new Logger(SyncRunnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adaptersRegistry: AdaptersRegistry,
    private readonly credentialStore: CredentialStoreService,
  ) {}

  async processJob(job: IntegrationSyncJobView): Promise<void> {
    const connection = await this.prisma.integrationConnection.findFirst({
      where: {
        id: job.connectionId,
        tenantId: job.tenantId,
        workspaceId: job.workspaceId,
        deletedAt: null,
      },
    });

    if (connection === null) {
      await this.failJob(job.id, job.attempt + 1, 'Connection was not found.', false);
      return;
    }

    if (!connection.isEnabled) {
      await this.failJob(job.id, job.attempt + 1, 'Connection is disabled.', false);
      return;
    }

    const now = new Date();
    const attempt = job.attempt + 1;

    await this.prisma.integrationSyncJob.update({
      where: { id: job.id },
      data: {
        status: IntegrationSyncStatus.RUNNING,
        startedAt: now,
        attempt,
        updatedAt: now,
        errorMessage: null,
      },
    });

    const started = Date.now();
    const credentials = await this.credentialStore.readCredentials(connection.id);
    const adapter = this.adaptersRegistry.getOrThrow(connection.providerKey);
    const ctx: AdapterContext = {
      tenantId: connection.tenantId,
      workspaceId: connection.workspaceId,
      connectionId: connection.id,
      providerKey: connection.providerKey,
      status: connection.status,
      config: asRecord(connection.config),
      credentials,
    };

    try {
      const result = await adapter.sync(ctx, {
        direction: job.direction,
        trigger: job.trigger,
      });
      const durationMs = Date.now() - started;
      const finishedAt = new Date();

      await this.prisma.integrationSyncJob.update({
        where: { id: job.id },
        data: {
          status: result.success ? IntegrationSyncStatus.SUCCEEDED : IntegrationSyncStatus.FAILED,
          finishedAt,
          updatedAt: finishedAt,
          nextRetryAt: null,
          errorMessage: result.success ? null : 'Adapter sync reported failure.',
        },
      });

      await this.prisma.integrationSyncLog.create({
        data: {
          id: randomUUID(),
          tenantId: job.tenantId,
          workspaceId: job.workspaceId,
          connectionId: job.connectionId,
          syncJobId: job.id,
          providerKey: connection.providerKey,
          direction: job.direction,
          status: result.success ? IntegrationSyncStatus.SUCCEEDED : IntegrationSyncStatus.FAILED,
          payload: { summary: summarizePayload(job.config) } as Prisma.InputJsonValue,
          result: result as unknown as Prisma.InputJsonValue,
          durationMs,
          retries: Math.max(0, attempt - 1),
          createdAt: finishedAt,
        },
      });

      await this.prisma.integrationConnection.update({
        where: { id: connection.id },
        data: {
          lastSyncAt: finishedAt,
          lastError: result.success ? null : 'Adapter sync reported failure.',
          updatedAt: finishedAt,
          status: result.success
            ? IntegrationConnectionStatus.CONNECTED
            : IntegrationConnectionStatus.ERROR,
        },
      });
    } catch (error) {
      const durationMs = Date.now() - started;
      const message = error instanceof Error ? error.message : String(error);
      const canRetry = attempt < job.maxAttempts;

      await this.failJob(job.id, attempt, message, canRetry);

      await this.prisma.integrationSyncLog.create({
        data: {
          id: randomUUID(),
          tenantId: job.tenantId,
          workspaceId: job.workspaceId,
          connectionId: job.connectionId,
          syncJobId: job.id,
          providerKey: connection.providerKey,
          direction: job.direction,
          status: IntegrationSyncStatus.FAILED,
          payload: { summary: summarizePayload(job.config) } as Prisma.InputJsonValue,
          errorMessage: message.slice(0, 2000),
          durationMs,
          retries: Math.max(0, attempt - 1),
          createdAt: new Date(),
        },
      });

      await this.prisma.integrationConnection.update({
        where: { id: connection.id },
        data: {
          lastError: message.slice(0, 2000),
          status: IntegrationConnectionStatus.ERROR,
          updatedAt: new Date(),
        },
      });

      this.logger.error(
        `Sync job ${job.id} failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async failJob(
    jobId: string,
    attempt: number,
    errorMessage: string,
    canRetry: boolean,
  ): Promise<void> {
    const now = new Date();
    await this.prisma.integrationSyncJob.update({
      where: { id: jobId },
      data: {
        status: IntegrationSyncStatus.FAILED,
        attempt,
        errorMessage: errorMessage.slice(0, 2000),
        finishedAt: canRetry ? null : now,
        nextRetryAt: canRetry ? new Date(now.getTime() + RETRY_BASE_MS * attempt) : null,
        updatedAt: now,
      },
    });
  }
}

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
}
