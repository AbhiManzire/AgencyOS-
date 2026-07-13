import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import {
  IntegrationConnectionStatus,
  IntegrationSyncTrigger,
  IntegrationWebhookDirection,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdaptersRegistry } from '../adapters/adapters.registry';
import type { AdapterContext } from '../adapters/integration-adapter.interface';
import { CredentialStoreService } from '../credentials/credential-store.service';
import {
  INTEGRATION_DOMAIN_ERROR_CODES,
  IntegrationDomainError,
} from '../domain/integration-domain.errors';
import { IntegrationDomainService } from '../domain/integration-domain.service';
import type {
  IntegrationApplicationContext,
  IntegrationCatalogEntry,
  IntegrationConnectionView,
  IntegrationHealthDashboard,
  IntegrationScope,
  IntegrationSyncJobView,
  IntegrationSyncLogView,
  IntegrationWebhookDeliveryView,
  IntegrationWebhookView,
} from '../domain/integration-domain.types';
import { SyncQueueService } from '../sync/sync-queue.service';
import { WebhookEngineService } from '../webhooks/webhook-engine.service';
import { IntegrationHealthService } from './integration-health.service';

@Injectable()
export class IntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domain: IntegrationDomainService,
    private readonly adaptersRegistry: AdaptersRegistry,
    private readonly credentialStore: CredentialStoreService,
    private readonly webhookEngine: WebhookEngineService,
    private readonly syncQueue: SyncQueueService,
    private readonly healthService: IntegrationHealthService,
  ) {}

  listCatalog(): readonly IntegrationCatalogEntry[] {
    return this.adaptersRegistry.listCatalog();
  }

  async listConnections(
    scope: IntegrationScope,
    query: {
      skip?: number;
      take?: number;
      providerKey?: string;
      status?: IntegrationConnectionStatus;
      includeArchived?: boolean;
    },
  ): Promise<{ items: IntegrationConnectionView[]; total: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 25;
    const where: Prisma.IntegrationConnectionWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(query.includeArchived === true ? {} : { deletedAt: null }),
      ...(query.providerKey !== undefined
        ? { providerKey: this.domain.assertProviderKey(query.providerKey) }
        : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.integrationConnection.findMany({
        where,
        include: { credentials: { select: { id: true } } },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.integrationConnection.count({ where }),
    ]);

    return {
      items: rows.map((row) => mapConnection(row, row.credentials !== null)),
      total,
    };
  }

  async getConnection(scope: IntegrationScope, id: string): Promise<IntegrationConnectionView> {
    const row = await this.requireConnection(scope, id, true);
    const hasCredentials = await this.credentialStore.hasCredentials(row.id);
    return mapConnection(row, hasCredentials);
  }

  async createConnection(
    scope: IntegrationScope,
    command: {
      providerKey: string;
      displayName: string;
      config?: Record<string, unknown>;
      isEnabled?: boolean;
    },
    context: IntegrationApplicationContext,
  ): Promise<IntegrationConnectionView> {
    this.domain.validateCreateConnection(command);
    const providerKey = this.domain.assertProviderKey(command.providerKey);
    const catalog = this.adaptersRegistry.getOrThrow(providerKey);
    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);

    const row = await this.prisma.integrationConnection.create({
      data: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        providerKey,
        displayName: this.domain.normalizeRequiredString(command.displayName),
        category: catalog.category,
        status: IntegrationConnectionStatus.DISCONNECTED,
        config: (command.config ?? {}) as Prisma.InputJsonValue,
        isEnabled: command.isEnabled ?? true,
        createdAt: now,
        updatedAt: now,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });

    return mapConnection(row, false);
  }

  async updateConnection(
    scope: IntegrationScope,
    id: string,
    command: {
      displayName?: string;
      config?: Record<string, unknown>;
      isEnabled?: boolean;
    },
    context: IntegrationApplicationContext,
  ): Promise<IntegrationConnectionView> {
    const existing = await this.requireConnection(scope, id, false);
    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);

    const row = await this.prisma.integrationConnection.update({
      where: { id: existing.id },
      data: {
        ...(command.displayName !== undefined
          ? { displayName: this.domain.normalizeRequiredString(command.displayName) }
          : {}),
        ...(command.config !== undefined
          ? { config: command.config as Prisma.InputJsonValue }
          : {}),
        ...(command.isEnabled !== undefined ? { isEnabled: command.isEnabled } : {}),
        updatedAt: now,
        updatedByUserId: actorUserId,
      },
    });

    const hasCredentials = await this.credentialStore.hasCredentials(row.id);
    return mapConnection(row, hasCredentials);
  }

  async archiveConnection(
    scope: IntegrationScope,
    id: string,
    context: IntegrationApplicationContext,
  ): Promise<IntegrationConnectionView> {
    const existing = await this.requireConnection(scope, id, false);
    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);

    if (existing.status === IntegrationConnectionStatus.CONNECTED) {
      await this.disconnect(scope, id, context);
    }

    const row = await this.prisma.integrationConnection.update({
      where: { id: existing.id },
      data: {
        deletedAt: now,
        deletedByUserId: actorUserId,
        updatedAt: now,
        updatedByUserId: actorUserId,
        status: IntegrationConnectionStatus.DISCONNECTED,
      },
    });

    return mapConnection(row, false);
  }

  async connect(
    scope: IntegrationScope,
    connectionId: string,
    credentials: Record<string, string>,
    context: IntegrationApplicationContext,
  ): Promise<IntegrationConnectionView> {
    const connection = await this.requireConnection(scope, connectionId, false);
    if (!connection.isEnabled) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.CONNECTION_DISABLED,
        'Connection is disabled.',
      );
    }

    if (Object.keys(credentials).length === 0) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.CREDENTIALS_REQUIRED,
        'Credentials are required to connect.',
      );
    }

    const actorUserId = normalizeActorUserId(context.actorUserId);
    await this.credentialStore.upsertCredentials(scope, connection.id, credentials, actorUserId);

    const adapter = this.adaptersRegistry.getOrThrow(connection.providerKey);
    const ctx = await this.buildAdapterContext(connection, credentials);
    const result = await adapter.connect(ctx);
    const now = new Date();

    const row = await this.prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        status: result.status,
        lastHealthAt: now,
        lastError: null,
        healthPayload: (result.metadata ?? {}) as Prisma.InputJsonValue,
        updatedAt: now,
        updatedByUserId: actorUserId,
      },
    });

    return mapConnection(row, true);
  }

  async disconnect(
    scope: IntegrationScope,
    connectionId: string,
    context: IntegrationApplicationContext,
  ): Promise<IntegrationConnectionView> {
    const connection = await this.requireConnection(scope, connectionId, false);
    const credentials = await this.credentialStore.readCredentials(connection.id);
    const adapter = this.adaptersRegistry.getOrThrow(connection.providerKey);
    const ctx = await this.buildAdapterContext(connection, credentials);
    await adapter.disconnect(ctx);
    await this.credentialStore.clearCredentials(connection.id);

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const row = await this.prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        status: IntegrationConnectionStatus.DISCONNECTED,
        lastError: null,
        updatedAt: now,
        updatedByUserId: actorUserId,
      },
    });

    return mapConnection(row, false);
  }

  async health(
    scope: IntegrationScope,
    connectionId: string,
  ): Promise<{
    connection: IntegrationConnectionView;
    healthy: boolean;
    details: Record<string, unknown>;
  }> {
    const connection = await this.requireConnection(scope, connectionId, false);
    const credentials = await this.credentialStore.readCredentials(connection.id);
    const adapter = this.adaptersRegistry.getOrThrow(connection.providerKey);
    const ctx = await this.buildAdapterContext(connection, credentials);
    const result = await adapter.health(ctx);
    const now = new Date();

    const row = await this.prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        lastHealthAt: now,
        healthPayload: (result.details ?? {}) as Prisma.InputJsonValue,
        rateLimitInfo:
          result.rateLimitInfo !== undefined
            ? (result.rateLimitInfo as Prisma.InputJsonValue)
            : undefined,
        status: result.status,
        updatedAt: now,
      },
    });

    const hasCredentials = await this.credentialStore.hasCredentials(row.id);
    return {
      connection: mapConnection(row, hasCredentials),
      healthy: result.healthy,
      details: result.details ?? {},
    };
  }

  async healthDashboard(scope: IntegrationScope): Promise<IntegrationHealthDashboard> {
    return this.healthService.dashboard(scope);
  }

  async sync(
    scope: IntegrationScope,
    connectionId: string,
    trigger: IntegrationSyncTrigger = IntegrationSyncTrigger.MANUAL,
    context?: IntegrationApplicationContext,
  ): Promise<IntegrationSyncJobView> {
    const connection = await this.requireConnection(scope, connectionId, false);
    if (!connection.isEnabled) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.CONNECTION_DISABLED,
        'Connection is disabled.',
      );
    }

    return this.syncQueue.enqueue({
      scope,
      connectionId: connection.id,
      trigger,
      actorUserId: context !== undefined ? normalizeActorUserId(context.actorUserId) : null,
    });
  }

  async listSyncJobs(
    scope: IntegrationScope,
    connectionId: string,
    query: { skip?: number; take?: number } = {},
  ): Promise<{ items: IntegrationSyncJobView[]; total: number }> {
    await this.requireConnection(scope, connectionId, true);
    const skip = query.skip ?? 0;
    const take = query.take ?? 25;
    const where: Prisma.IntegrationSyncJobWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      connectionId,
    };

    const [rows, total] = await Promise.all([
      this.prisma.integrationSyncJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.integrationSyncJob.count({ where }),
    ]);

    return { items: rows.map(mapSyncJob), total };
  }

  async listSyncLogs(
    scope: IntegrationScope,
    query: { connectionId?: string; skip?: number; take?: number } = {},
  ): Promise<{ items: IntegrationSyncLogView[]; total: number }> {
    if (query.connectionId !== undefined) {
      await this.requireConnection(scope, query.connectionId, true);
    }

    const skip = query.skip ?? 0;
    const take = query.take ?? 25;
    const where: Prisma.IntegrationSyncLogWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(query.connectionId !== undefined ? { connectionId: query.connectionId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.integrationSyncLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.integrationSyncLog.count({ where }),
    ]);

    return { items: rows.map(mapSyncLog), total };
  }

  async createWebhook(
    scope: IntegrationScope,
    connectionId: string,
    command: {
      direction: string;
      name: string;
      endpointPath?: string | null;
      targetUrl?: string | null;
      secret?: string | null;
      signatureHeader?: string | null;
      isActive?: boolean;
      config?: Record<string, unknown>;
    },
    context: IntegrationApplicationContext,
  ): Promise<IntegrationWebhookView> {
    const connection = await this.requireConnection(scope, connectionId, false);
    this.domain.validateCreateWebhook(command);
    const direction = this.domain.assertWebhookDirection(command.direction);
    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const secret = this.domain.normalizeOptionalString(command.secret ?? null);
    const secretHash =
      secret !== null ? createHash('sha256').update(secret, 'utf8').digest('hex') : null;

    if (secret !== null) {
      const existingCreds = await this.credentialStore.readCredentials(connection.id);
      await this.credentialStore.upsertCredentials(
        scope,
        connection.id,
        { ...existingCreds, webhookSecret: secret },
        actorUserId,
      );
    }

    const row = await this.prisma.integrationWebhook.create({
      data: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        connectionId: connection.id,
        direction,
        name: this.domain.normalizeRequiredString(command.name),
        endpointPath:
          direction === IntegrationWebhookDirection.INCOMING
            ? this.domain.normalizeRequiredString(command.endpointPath ?? '')
            : this.domain.normalizeOptionalString(command.endpointPath ?? null),
        targetUrl:
          direction === IntegrationWebhookDirection.OUTGOING
            ? this.domain.normalizeRequiredString(command.targetUrl ?? '')
            : this.domain.normalizeOptionalString(command.targetUrl ?? null),
        secretHash,
        signatureHeader: this.domain.normalizeOptionalString(command.signatureHeader ?? null),
        isActive: command.isActive ?? true,
        config: (command.config ?? {}) as Prisma.InputJsonValue,
        createdAt: now,
        updatedAt: now,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });

    return mapWebhook(row);
  }

  async listWebhooks(
    scope: IntegrationScope,
    connectionId: string,
  ): Promise<IntegrationWebhookView[]> {
    await this.requireConnection(scope, connectionId, true);
    const rows = await this.prisma.integrationWebhook.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        connectionId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapWebhook);
  }

  async updateWebhook(
    scope: IntegrationScope,
    connectionId: string,
    webhookId: string,
    command: {
      name?: string;
      endpointPath?: string | null;
      targetUrl?: string | null;
      secret?: string | null;
      signatureHeader?: string | null;
      isActive?: boolean;
      config?: Record<string, unknown>;
    },
    context: IntegrationApplicationContext,
  ): Promise<IntegrationWebhookView> {
    await this.requireConnection(scope, connectionId, false);
    const existing = await this.requireWebhook(scope, connectionId, webhookId);
    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);

    let secretHash = existing.secretHash;
    if (command.secret !== undefined) {
      const secret = this.domain.normalizeOptionalString(command.secret);
      secretHash =
        secret !== null ? createHash('sha256').update(secret, 'utf8').digest('hex') : null;
      if (secret !== null) {
        const existingCreds = await this.credentialStore.readCredentials(connectionId);
        await this.credentialStore.upsertCredentials(
          scope,
          connectionId,
          { ...existingCreds, webhookSecret: secret },
          actorUserId,
        );
      }
    }

    const row = await this.prisma.integrationWebhook.update({
      where: { id: existing.id },
      data: {
        ...(command.name !== undefined
          ? { name: this.domain.normalizeRequiredString(command.name) }
          : {}),
        ...(command.endpointPath !== undefined
          ? { endpointPath: this.domain.normalizeOptionalString(command.endpointPath) }
          : {}),
        ...(command.targetUrl !== undefined
          ? { targetUrl: this.domain.normalizeOptionalString(command.targetUrl) }
          : {}),
        ...(command.signatureHeader !== undefined
          ? {
              signatureHeader: this.domain.normalizeOptionalString(command.signatureHeader),
            }
          : {}),
        ...(command.isActive !== undefined ? { isActive: command.isActive } : {}),
        ...(command.config !== undefined
          ? { config: command.config as Prisma.InputJsonValue }
          : {}),
        secretHash,
        updatedAt: now,
        updatedByUserId: actorUserId,
      },
    });

    return mapWebhook(row);
  }

  async deleteWebhook(
    scope: IntegrationScope,
    connectionId: string,
    webhookId: string,
  ): Promise<IntegrationWebhookView> {
    await this.requireConnection(scope, connectionId, false);
    const existing = await this.requireWebhook(scope, connectionId, webhookId);
    const now = new Date();
    const row = await this.prisma.integrationWebhook.update({
      where: { id: existing.id },
      data: {
        deletedAt: now,
        isActive: false,
        updatedAt: now,
      },
    });
    return mapWebhook(row);
  }

  async receiveWebhook(
    scope: IntegrationScope,
    endpointPath: string,
    input: {
      rawBody: string | Buffer;
      parsedPayload: unknown;
      headers: Record<string, string | string[] | undefined>;
    },
  ): Promise<{
    accepted: boolean;
    deliveryId: string;
    result: unknown;
  }> {
    const webhook = await this.prisma.integrationWebhook.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        endpointPath,
        direction: IntegrationWebhookDirection.INCOMING,
        deletedAt: null,
        isActive: true,
      },
      include: { connection: true },
    });

    if (webhook?.connection.deletedAt !== null) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.WEBHOOK_NOT_FOUND,
        'Webhook endpoint was not found.',
      );
    }

    const { deliveryId } = await this.webhookEngine.createIncomingDeliveryAndValidate({
      scope,
      webhookId: webhook.id,
      rawBody: input.rawBody,
      parsedPayload: input.parsedPayload,
      headers: input.headers,
      signatureHeader: webhook.signatureHeader,
      secretHash: webhook.secretHash,
      connectionId: webhook.connectionId,
    });

    const started = Date.now();
    try {
      const credentials = await this.credentialStore.readCredentials(webhook.connectionId);
      const adapter = this.adaptersRegistry.getOrThrow(webhook.connection.providerKey);
      const ctx = await this.buildAdapterContext(webhook.connection, credentials);
      const result = await adapter.receive(ctx, input.parsedPayload);
      await this.webhookEngine.markDeliverySucceeded(deliveryId, result, Date.now() - started);
      return { accepted: result.accepted, deliveryId, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.webhookEngine.markDeliveryFailed(deliveryId, message, Date.now() - started);
      throw error;
    }
  }

  async sendWebhook(
    scope: IntegrationScope,
    connectionId: string,
    webhookId: string,
    payload: unknown,
  ): Promise<IntegrationWebhookDeliveryView> {
    await this.requireConnection(scope, connectionId, false);
    const webhook = await this.requireWebhook(scope, connectionId, webhookId);

    if (webhook.direction !== IntegrationWebhookDirection.OUTGOING) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.INVALID_DIRECTION,
        'Only outgoing webhooks can send payloads.',
      );
    }

    if (webhook.targetUrl === null) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.WEBHOOK_TARGET_URL_REQUIRED,
        'Outgoing webhook is missing targetUrl.',
      );
    }

    const credentials = await this.credentialStore.readCredentials(connectionId);
    return this.webhookEngine.sendOutgoing({
      scope,
      webhookId: webhook.id,
      targetUrl: webhook.targetUrl,
      payload,
      secret: 'webhookSecret' in credentials ? credentials.webhookSecret : null,
      signatureHeader: webhook.signatureHeader,
    });
  }

  async listWebhookDeliveries(
    scope: IntegrationScope,
    query: { webhookId?: string; skip?: number; take?: number } = {},
  ): Promise<{ items: IntegrationWebhookDeliveryView[]; total: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 25;
    const where: Prisma.IntegrationWebhookDeliveryWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(query.webhookId !== undefined ? { webhookId: query.webhookId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.integrationWebhookDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.integrationWebhookDelivery.count({ where }),
    ]);

    return { items: rows.map(mapDelivery), total };
  }

  private async requireConnection(
    scope: IntegrationScope,
    id: string,
    allowArchived: boolean,
  ): Promise<{
    id: string;
    tenantId: string;
    workspaceId: string;
    providerKey: import('@prisma/client').IntegrationProviderKey;
    displayName: string;
    category: import('@prisma/client').IntegrationCategory;
    status: IntegrationConnectionStatus;
    config: Prisma.JsonValue;
    lastSyncAt: Date | null;
    lastHealthAt: Date | null;
    lastError: string | null;
    healthPayload: Prisma.JsonValue | null;
    rateLimitInfo: Prisma.JsonValue | null;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }> {
    const row = await this.prisma.integrationConnection.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
    });

    if (row === null) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.CONNECTION_NOT_FOUND,
        'Integration connection was not found.',
      );
    }

    if (!allowArchived && row.deletedAt !== null) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.CONNECTION_ARCHIVED,
        'Integration connection is archived.',
      );
    }

    return row;
  }

  private async requireWebhook(
    scope: IntegrationScope,
    connectionId: string,
    webhookId: string,
  ): Promise<{
    id: string;
    tenantId: string;
    workspaceId: string;
    connectionId: string;
    direction: IntegrationWebhookDirection;
    name: string;
    endpointPath: string | null;
    targetUrl: string | null;
    secretHash: string | null;
    signatureHeader: string | null;
    isActive: boolean;
    config: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }> {
    const row = await this.prisma.integrationWebhook.findFirst({
      where: {
        id: webhookId,
        connectionId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    if (row === null) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.WEBHOOK_NOT_FOUND,
        'Integration webhook was not found.',
      );
    }

    return row;
  }

  private buildAdapterContext(
    connection: {
      id: string;
      tenantId: string;
      workspaceId: string;
      providerKey: import('@prisma/client').IntegrationProviderKey;
      status: IntegrationConnectionStatus;
      config: Prisma.JsonValue;
    },
    credentials: Record<string, string>,
  ): Promise<AdapterContext> {
    return Promise.resolve({
      tenantId: connection.tenantId,
      workspaceId: connection.workspaceId,
      connectionId: connection.id,
      providerKey: connection.providerKey,
      status: connection.status,
      config: asRecord(connection.config),
      credentials,
    });
  }
}

function normalizeActorUserId(actorUserId: string): string | null {
  const trimmed = actorUserId.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
}

function mapConnection(
  row: {
    id: string;
    tenantId: string;
    workspaceId: string;
    providerKey: import('@prisma/client').IntegrationProviderKey;
    displayName: string;
    category: import('@prisma/client').IntegrationCategory;
    status: IntegrationConnectionStatus;
    config: Prisma.JsonValue;
    lastSyncAt: Date | null;
    lastHealthAt: Date | null;
    lastError: string | null;
    healthPayload: Prisma.JsonValue | null;
    rateLimitInfo: Prisma.JsonValue | null;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  },
  hasCredentials: boolean,
): IntegrationConnectionView {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workspaceId: row.workspaceId,
    providerKey: row.providerKey,
    displayName: row.displayName,
    category: row.category,
    status: row.status,
    config: row.config,
    lastSyncAt: row.lastSyncAt,
    lastHealthAt: row.lastHealthAt,
    lastError: row.lastError,
    healthPayload: row.healthPayload,
    rateLimitInfo: row.rateLimitInfo,
    isEnabled: row.isEnabled,
    hasCredentials,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

function mapWebhook(row: {
  id: string;
  tenantId: string;
  workspaceId: string;
  connectionId: string;
  direction: IntegrationWebhookDirection;
  name: string;
  endpointPath: string | null;
  targetUrl: string | null;
  secretHash: string | null;
  signatureHeader: string | null;
  isActive: boolean;
  config: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): IntegrationWebhookView {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workspaceId: row.workspaceId,
    connectionId: row.connectionId,
    direction: row.direction,
    name: row.name,
    endpointPath: row.endpointPath,
    targetUrl: row.targetUrl,
    signatureHeader: row.signatureHeader,
    isActive: row.isActive,
    config: row.config,
    hasSecret: row.secretHash !== null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

function mapSyncJob(row: {
  id: string;
  tenantId: string;
  workspaceId: string;
  connectionId: string;
  trigger: import('@prisma/client').IntegrationSyncTrigger;
  direction: import('@prisma/client').IntegrationSyncDirection;
  status: import('@prisma/client').IntegrationSyncStatus;
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

function mapSyncLog(row: {
  id: string;
  tenantId: string;
  workspaceId: string;
  connectionId: string;
  syncJobId: string | null;
  providerKey: import('@prisma/client').IntegrationProviderKey;
  direction: import('@prisma/client').IntegrationSyncDirection;
  status: import('@prisma/client').IntegrationSyncStatus;
  payload: Prisma.JsonValue | null;
  result: Prisma.JsonValue | null;
  errorMessage: string | null;
  durationMs: number | null;
  retries: number;
  createdAt: Date;
}): IntegrationSyncLogView {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workspaceId: row.workspaceId,
    connectionId: row.connectionId,
    syncJobId: row.syncJobId,
    providerKey: row.providerKey,
    direction: row.direction,
    status: row.status,
    payload: row.payload,
    result: row.result,
    errorMessage: row.errorMessage,
    durationMs: row.durationMs,
    retries: row.retries,
    createdAt: row.createdAt,
  };
}

function mapDelivery(row: {
  id: string;
  tenantId: string;
  workspaceId: string;
  webhookId: string;
  direction: IntegrationWebhookDirection;
  status: import('@prisma/client').IntegrationWebhookDeliveryStatus;
  httpStatus: number | null;
  requestPayload: Prisma.JsonValue | null;
  responsePayload: Prisma.JsonValue | null;
  errorMessage: string | null;
  signatureValid: boolean | null;
  attempt: number;
  maxAttempts: number;
  nextRetryAt: Date | null;
  durationMs: number | null;
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
}): IntegrationWebhookDeliveryView {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workspaceId: row.workspaceId,
    webhookId: row.webhookId,
    direction: row.direction,
    status: row.status,
    httpStatus: row.httpStatus,
    requestPayload: row.requestPayload,
    responsePayload: row.responsePayload,
    errorMessage: row.errorMessage,
    signatureValid: row.signatureValid,
    attempt: row.attempt,
    maxAttempts: row.maxAttempts,
    nextRetryAt: row.nextRetryAt,
    durationMs: row.durationMs,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    finishedAt: row.finishedAt,
  };
}
