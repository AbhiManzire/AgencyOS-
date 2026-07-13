import {
  IntegrationConnectionStatus,
  type IntegrationCategory,
  type IntegrationProviderKey,
} from '@prisma/client';
import {
  INTEGRATION_DOMAIN_ERROR_CODES,
  IntegrationDomainError,
} from '../domain/integration-domain.errors';
import type {
  AdapterConnectResult,
  AdapterContext,
  AdapterHealthResult,
  AdapterReceiveResult,
  AdapterSendResult,
  AdapterSyncOptions,
  AdapterSyncResult,
  IntegrationAdapter,
} from './integration-adapter.interface';

const ARCHITECTURE_MODE = 'architecture';

export abstract class BaseAdapter implements IntegrationAdapter {
  abstract readonly key: IntegrationProviderKey;
  abstract readonly label: string;
  abstract readonly category: IntegrationCategory;
  abstract readonly description: string;

  connect(ctx: AdapterContext): Promise<AdapterConnectResult> {
    if (Object.keys(ctx.credentials).length === 0) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.CREDENTIALS_REQUIRED,
        'Credentials are required to connect this integration.',
      );
    }

    return Promise.resolve({
      status: IntegrationConnectionStatus.CONNECTED,
      metadata: { mode: ARCHITECTURE_MODE, providerKey: this.key },
    });
  }

  disconnect(_ctx: AdapterContext): Promise<void> {
    return Promise.resolve();
  }

  health(ctx: AdapterContext): Promise<AdapterHealthResult> {
    const healthy = ctx.status === IntegrationConnectionStatus.CONNECTED;
    return Promise.resolve({
      healthy,
      status: ctx.status,
      checkedAt: new Date(),
      details: { mode: ARCHITECTURE_MODE, providerKey: this.key },
    });
  }

  receive(_ctx: AdapterContext, payload: unknown): Promise<AdapterReceiveResult> {
    return Promise.resolve({
      accepted: true,
      normalized: payload,
      mode: ARCHITECTURE_MODE,
      details: { providerKey: this.key },
    });
  }

  send(_ctx: AdapterContext, payload: unknown): Promise<AdapterSendResult> {
    return Promise.resolve({
      sent: true,
      mode: ARCHITECTURE_MODE,
      details: { providerKey: this.key, payloadSummary: summarizePayload(payload) },
    });
  }

  sync(_ctx: AdapterContext, options?: AdapterSyncOptions): Promise<AdapterSyncResult> {
    return Promise.resolve({
      success: true,
      mode: ARCHITECTURE_MODE,
      recordsProcessed: 0,
      details: {
        providerKey: this.key,
        direction: options?.direction ?? 'INBOUND',
        trigger: options?.trigger ?? 'MANUAL',
      },
    });
  }
}

export function summarizePayload(payload: unknown): Record<string, unknown> {
  if (payload === null || payload === undefined) {
    return { empty: true };
  }

  if (Array.isArray(payload)) {
    return { type: 'array', length: payload.length };
  }

  if (typeof payload === 'object') {
    return { type: 'object', keys: Object.keys(payload).slice(0, 20) };
  }

  return { type: typeof payload };
}
