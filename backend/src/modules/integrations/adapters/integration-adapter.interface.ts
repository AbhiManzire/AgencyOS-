import type {
  IntegrationCategory,
  IntegrationConnectionStatus,
  IntegrationProviderKey,
  IntegrationSyncDirection,
} from '@prisma/client';

export interface AdapterContext {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly connectionId: string;
  readonly providerKey: IntegrationProviderKey;
  readonly status: IntegrationConnectionStatus;
  readonly config: Record<string, unknown>;
  readonly credentials: Record<string, string>;
}

export interface AdapterConnectResult {
  readonly status: IntegrationConnectionStatus;
  readonly metadata?: Record<string, unknown>;
}

export interface AdapterHealthResult {
  readonly healthy: boolean;
  readonly status: IntegrationConnectionStatus;
  readonly checkedAt: Date;
  readonly details?: Record<string, unknown>;
  readonly rateLimitInfo?: Record<string, unknown>;
}

export interface AdapterReceiveResult {
  readonly accepted: boolean;
  readonly normalized?: unknown;
  readonly mode?: string;
  readonly details?: Record<string, unknown>;
}

export interface AdapterSendResult {
  readonly sent: boolean;
  readonly mode?: string;
  readonly details?: Record<string, unknown>;
}

export interface AdapterSyncOptions {
  readonly direction?: IntegrationSyncDirection;
  readonly trigger?: string;
  readonly since?: Date;
}

export interface AdapterSyncResult {
  readonly success: boolean;
  readonly mode?: string;
  readonly recordsProcessed?: number;
  readonly details?: Record<string, unknown>;
}

export interface IntegrationAdapter {
  readonly key: IntegrationProviderKey;
  readonly label: string;
  readonly category: IntegrationCategory;
  readonly description: string;
  connect(ctx: AdapterContext): Promise<AdapterConnectResult>;
  disconnect(ctx: AdapterContext): Promise<void>;
  health(ctx: AdapterContext): Promise<AdapterHealthResult>;
  receive(ctx: AdapterContext, payload: unknown): Promise<AdapterReceiveResult>;
  send(ctx: AdapterContext, payload: unknown): Promise<AdapterSendResult>;
  sync(ctx: AdapterContext, options?: AdapterSyncOptions): Promise<AdapterSyncResult>;
}
