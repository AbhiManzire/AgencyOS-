import type {
  IntegrationCategory,
  IntegrationConnectionStatus,
  IntegrationProviderKey,
  IntegrationSyncDirection,
  IntegrationSyncStatus,
  IntegrationSyncTrigger,
  IntegrationWebhookDeliveryStatus,
  IntegrationWebhookDirection,
  Prisma,
} from '@prisma/client';

export interface IntegrationScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface IntegrationApplicationContext {
  readonly actorUserId: string;
}

export interface IntegrationCatalogEntry {
  readonly key: IntegrationProviderKey;
  readonly label: string;
  readonly category: IntegrationCategory;
  readonly description: string;
}

export interface IntegrationConnectionView {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly providerKey: IntegrationProviderKey;
  readonly displayName: string;
  readonly category: IntegrationCategory;
  readonly status: IntegrationConnectionStatus;
  readonly config: Prisma.JsonValue;
  readonly lastSyncAt: Date | null;
  readonly lastHealthAt: Date | null;
  readonly lastError: string | null;
  readonly healthPayload: Prisma.JsonValue | null;
  readonly rateLimitInfo: Prisma.JsonValue | null;
  readonly isEnabled: boolean;
  readonly hasCredentials: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface IntegrationWebhookView {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly connectionId: string;
  readonly direction: IntegrationWebhookDirection;
  readonly name: string;
  readonly endpointPath: string | null;
  readonly targetUrl: string | null;
  readonly signatureHeader: string | null;
  readonly isActive: boolean;
  readonly config: Prisma.JsonValue;
  readonly hasSecret: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface IntegrationWebhookDeliveryView {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly webhookId: string;
  readonly direction: IntegrationWebhookDirection;
  readonly status: IntegrationWebhookDeliveryStatus;
  readonly httpStatus: number | null;
  readonly requestPayload: Prisma.JsonValue | null;
  readonly responsePayload: Prisma.JsonValue | null;
  readonly errorMessage: string | null;
  readonly signatureValid: boolean | null;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly nextRetryAt: Date | null;
  readonly durationMs: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly finishedAt: Date | null;
}

export interface IntegrationSyncJobView {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly connectionId: string;
  readonly trigger: IntegrationSyncTrigger;
  readonly direction: IntegrationSyncDirection;
  readonly status: IntegrationSyncStatus;
  readonly scheduledFor: Date | null;
  readonly startedAt: Date | null;
  readonly finishedAt: Date | null;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly nextRetryAt: Date | null;
  readonly errorMessage: string | null;
  readonly config: Prisma.JsonValue;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IntegrationSyncLogView {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly connectionId: string;
  readonly syncJobId: string | null;
  readonly providerKey: IntegrationProviderKey;
  readonly direction: IntegrationSyncDirection;
  readonly status: IntegrationSyncStatus;
  readonly payload: Prisma.JsonValue | null;
  readonly result: Prisma.JsonValue | null;
  readonly errorMessage: string | null;
  readonly durationMs: number | null;
  readonly retries: number;
  readonly createdAt: Date;
}

export interface IntegrationHealthDashboard {
  readonly connected: number;
  readonly disconnected: number;
  readonly failed: number;
  readonly pending: number;
  readonly total: number;
  readonly rateLimitSummaries: readonly {
    readonly connectionId: string;
    readonly providerKey: IntegrationProviderKey;
    readonly displayName: string;
    readonly rateLimitInfo: Prisma.JsonValue | null;
  }[];
}
