import { Injectable, Logger } from '@nestjs/common';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  IntegrationWebhookDeliveryStatus,
  IntegrationWebhookDirection,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  INTEGRATION_DOMAIN_ERROR_CODES,
  IntegrationDomainError,
} from '../domain/integration-domain.errors';
import type {
  IntegrationScope,
  IntegrationWebhookDeliveryView,
} from '../domain/integration-domain.types';
import { CredentialStoreService } from '../credentials/credential-store.service';

const DEFAULT_SIGNATURE_HEADER = 'x-agencyos-signature';
const RETRY_BASE_MS = 60_000;

export interface IncomingWebhookReceiveInput {
  readonly endpointPath: string;
  readonly rawBody: string | Buffer;
  readonly parsedPayload: unknown;
  readonly headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class WebhookEngineService {
  private readonly logger = new Logger(WebhookEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly credentialStore: CredentialStoreService,
  ) {}

  hashSecret(secret: string): string {
    return createHash('sha256').update(secret, 'utf8').digest('hex');
  }

  async createIncomingDeliveryAndValidate(input: {
    scope: IntegrationScope;
    webhookId: string;
    rawBody: string | Buffer;
    parsedPayload: unknown;
    headers: Record<string, string | string[] | undefined>;
    signatureHeader: string | null;
    secretHash: string | null;
    connectionId: string;
  }): Promise<{
    deliveryId: string;
    signatureValid: boolean | null;
  }> {
    const now = new Date();
    const secret = await this.resolveWebhookSecret(input.connectionId, input.secretHash);
    const headerName = (input.signatureHeader ?? DEFAULT_SIGNATURE_HEADER).toLowerCase();
    const providedSignature = readHeader(input.headers, headerName);

    let signatureValid: boolean | null = null;

    if (secret !== null) {
      if (providedSignature === null || providedSignature.length === 0) {
        throw new IntegrationDomainError(
          INTEGRATION_DOMAIN_ERROR_CODES.WEBHOOK_SIGNATURE_REQUIRED,
          'Webhook signature header is required.',
        );
      }

      signatureValid = this.verifyHmacSha256(secret, input.rawBody, providedSignature);
      if (!signatureValid) {
        throw new IntegrationDomainError(
          INTEGRATION_DOMAIN_ERROR_CODES.WEBHOOK_SIGNATURE_INVALID,
          'Webhook signature validation failed.',
        );
      }
    }

    const deliveryId = randomUUID();
    await this.prisma.integrationWebhookDelivery.create({
      data: {
        id: deliveryId,
        tenantId: input.scope.tenantId,
        workspaceId: input.scope.workspaceId,
        webhookId: input.webhookId,
        direction: IntegrationWebhookDirection.INCOMING,
        status: IntegrationWebhookDeliveryStatus.PENDING,
        requestPayload: toJsonValue(input.parsedPayload),
        signatureValid,
        attempt: 1,
        maxAttempts: 1,
        createdAt: now,
        updatedAt: now,
      },
    });

    return { deliveryId, signatureValid };
  }

  async markDeliverySucceeded(
    deliveryId: string,
    responsePayload: unknown,
    durationMs: number,
  ): Promise<void> {
    const now = new Date();
    await this.prisma.integrationWebhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: IntegrationWebhookDeliveryStatus.SUCCEEDED,
        responsePayload: toJsonValue(responsePayload),
        durationMs,
        finishedAt: now,
        updatedAt: now,
        httpStatus: 200,
      },
    });
  }

  async markDeliveryFailed(
    deliveryId: string,
    errorMessage: string,
    durationMs: number,
  ): Promise<void> {
    const now = new Date();
    await this.prisma.integrationWebhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: IntegrationWebhookDeliveryStatus.FAILED,
        errorMessage: errorMessage.slice(0, 2000),
        durationMs,
        finishedAt: now,
        updatedAt: now,
      },
    });
  }

  async sendOutgoing(input: {
    scope: IntegrationScope;
    webhookId: string;
    targetUrl: string;
    payload: unknown;
    secret: string | null;
    signatureHeader: string | null;
  }): Promise<IntegrationWebhookDeliveryView> {
    const now = new Date();
    const deliveryId = randomUUID();
    const body = JSON.stringify(input.payload ?? {});
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (input.secret !== null && input.secret.length > 0) {
      const signature = createHmac('sha256', input.secret).update(body, 'utf8').digest('hex');
      headers[(input.signatureHeader ?? DEFAULT_SIGNATURE_HEADER).toLowerCase()] = signature;
    }

    await this.prisma.integrationWebhookDelivery.create({
      data: {
        id: deliveryId,
        tenantId: input.scope.tenantId,
        workspaceId: input.scope.workspaceId,
        webhookId: input.webhookId,
        direction: IntegrationWebhookDirection.OUTGOING,
        status: IntegrationWebhookDeliveryStatus.PENDING,
        requestPayload: toJsonValue(input.payload),
        attempt: 1,
        maxAttempts: 3,
        createdAt: now,
        updatedAt: now,
      },
    });

    const started = Date.now();
    try {
      const response = await fetch(input.targetUrl, {
        method: 'POST',
        headers,
        body,
      });
      const durationMs = Date.now() - started;
      const responseText = await response.text();
      let responsePayload: unknown = responseText;
      try {
        responsePayload = JSON.parse(responseText) as unknown;
      } catch {
        // keep text
      }

      if (!response.ok) {
        const nextRetryAt = new Date(now.getTime() + RETRY_BASE_MS);
        const updated = await this.prisma.integrationWebhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: IntegrationWebhookDeliveryStatus.RETRYING,
            httpStatus: response.status,
            responsePayload: toJsonValue(responsePayload),
            errorMessage: `HTTP ${String(response.status)}`,
            durationMs,
            nextRetryAt,
            updatedAt: new Date(),
          },
        });
        return mapDelivery(updated);
      }

      const updated = await this.prisma.integrationWebhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: IntegrationWebhookDeliveryStatus.SUCCEEDED,
          httpStatus: response.status,
          responsePayload: toJsonValue(responsePayload),
          durationMs,
          finishedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return mapDelivery(updated);
    } catch (error) {
      const durationMs = Date.now() - started;
      const message = error instanceof Error ? error.message : String(error);
      const updated = await this.prisma.integrationWebhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: IntegrationWebhookDeliveryStatus.RETRYING,
          errorMessage: message.slice(0, 2000),
          durationMs,
          nextRetryAt: new Date(Date.now() + RETRY_BASE_MS),
          updatedAt: new Date(),
        },
      });
      return mapDelivery(updated);
    }
  }

  async processDueRetries(limit = 50): Promise<number> {
    const now = new Date();
    const due = await this.prisma.integrationWebhookDelivery.findMany({
      where: {
        status: {
          in: [IntegrationWebhookDeliveryStatus.PENDING, IntegrationWebhookDeliveryStatus.RETRYING],
        },
        direction: IntegrationWebhookDirection.OUTGOING,
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      include: { webhook: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    let processed = 0;
    for (const delivery of due) {
      if (delivery.webhook.deletedAt !== null || !delivery.webhook.isActive) {
        continue;
      }
      if (delivery.webhook.targetUrl === null) {
        continue;
      }
      if (delivery.attempt >= delivery.maxAttempts) {
        await this.prisma.integrationWebhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: IntegrationWebhookDeliveryStatus.FAILED,
            finishedAt: now,
            updatedAt: now,
            errorMessage: delivery.errorMessage ?? 'Max retry attempts exceeded.',
          },
        });
        continue;
      }

      const secret = await this.resolveWebhookSecret(
        delivery.webhook.connectionId,
        delivery.webhook.secretHash,
      );

      try {
        await this.retryOutgoingDelivery({
          deliveryId: delivery.id,
          attempt: delivery.attempt + 1,
          targetUrl: delivery.webhook.targetUrl,
          payload: delivery.requestPayload,
          secret,
          signatureHeader: delivery.webhook.signatureHeader,
        });
        processed += 1;
      } catch (error) {
        this.logger.error(
          `Webhook retry failed for delivery ${delivery.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return processed;
  }

  private async retryOutgoingDelivery(input: {
    deliveryId: string;
    attempt: number;
    targetUrl: string;
    payload: Prisma.JsonValue | null;
    secret: string | null;
    signatureHeader: string | null;
  }): Promise<void> {
    const body = JSON.stringify(input.payload ?? {});
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (input.secret !== null && input.secret.length > 0) {
      const signature = createHmac('sha256', input.secret).update(body, 'utf8').digest('hex');
      headers[(input.signatureHeader ?? DEFAULT_SIGNATURE_HEADER).toLowerCase()] = signature;
    }

    const started = Date.now();
    try {
      const response = await fetch(input.targetUrl, {
        method: 'POST',
        headers,
        body,
      });
      const durationMs = Date.now() - started;
      const responseText = await response.text();
      let responsePayload: unknown = responseText;
      try {
        responsePayload = JSON.parse(responseText) as unknown;
      } catch {
        // keep text
      }

      if (!response.ok) {
        await this.prisma.integrationWebhookDelivery.update({
          where: { id: input.deliveryId },
          data: {
            attempt: input.attempt,
            status: IntegrationWebhookDeliveryStatus.RETRYING,
            httpStatus: response.status,
            responsePayload: toJsonValue(responsePayload),
            errorMessage: `HTTP ${String(response.status)}`,
            durationMs,
            nextRetryAt: new Date(Date.now() + RETRY_BASE_MS * input.attempt),
            updatedAt: new Date(),
          },
        });
        return;
      }

      await this.prisma.integrationWebhookDelivery.update({
        where: { id: input.deliveryId },
        data: {
          attempt: input.attempt,
          status: IntegrationWebhookDeliveryStatus.SUCCEEDED,
          httpStatus: response.status,
          responsePayload: toJsonValue(responsePayload),
          durationMs,
          finishedAt: new Date(),
          nextRetryAt: null,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.integrationWebhookDelivery.update({
        where: { id: input.deliveryId },
        data: {
          attempt: input.attempt,
          status: IntegrationWebhookDeliveryStatus.RETRYING,
          errorMessage: message.slice(0, 2000),
          durationMs: Date.now() - started,
          nextRetryAt: new Date(Date.now() + RETRY_BASE_MS * input.attempt),
          updatedAt: new Date(),
        },
      });
    }
  }

  verifyHmacSha256(secret: string, rawBody: string | Buffer, provided: string): boolean {
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expected = createHmac('sha256', secret).update(body, 'utf8').digest('hex');
    const normalizedProvided = provided.replace(/^sha256=/i, '').trim();

    const expectedBuf = Buffer.from(expected, 'utf8');
    const providedBuf = Buffer.from(normalizedProvided, 'utf8');
    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }
    return timingSafeEqual(expectedBuf, providedBuf);
  }

  private async resolveWebhookSecret(
    connectionId: string,
    secretHash: string | null,
  ): Promise<string | null> {
    const credentials = await this.credentialStore.readCredentials(connectionId);
    const rawSecret = 'webhookSecret' in credentials ? credentials.webhookSecret : undefined;
    const fromCredentials = rawSecret?.trim();
    if (fromCredentials !== undefined && fromCredentials.length > 0) {
      if (secretHash !== null && this.hashSecret(fromCredentials) !== secretHash) {
        // Prefer credentials secret when present; hash mismatch is logged only.
        this.logger.warn(
          `Webhook secret hash mismatch for connection ${connectionId}; using credential secret.`,
        );
      }
      return fromCredentials;
    }
    return null;
  }
}

function readHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (value === undefined) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === undefined) {
    return {};
  }
  return value as Prisma.InputJsonValue;
}

function mapDelivery(row: {
  id: string;
  tenantId: string;
  workspaceId: string;
  webhookId: string;
  direction: IntegrationWebhookDirection;
  status: IntegrationWebhookDeliveryStatus;
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
