export const INTEGRATION_PROVIDER_KEYS = [
  'META_LEAD_ADS',
  'GOOGLE_LEAD_FORMS',
  'GOOGLE_ADS',
  'GOOGLE_ANALYTICS',
  'WEBSITE_FORMS',
  'WHATSAPP_BUSINESS',
  'GMAIL',
  'OUTLOOK',
  'STRIPE',
  'RAZORPAY',
  'PHONEPE',
  'PAYPAL',
  'TALLY',
  'ZOHO_BOOKS',
  'SLACK',
  'MICROSOFT_TEAMS',
  'WEBHOOK',
  'REST_API',
  'CUSTOM',
] as const;

export type IntegrationProviderKey = (typeof INTEGRATION_PROVIDER_KEYS)[number];

export const INTEGRATION_CATEGORIES = [
  'LEADS',
  'ADS',
  'ANALYTICS',
  'MESSAGING',
  'EMAIL',
  'PAYMENTS',
  'ACCOUNTING',
  'COLLABORATION',
  'WEBHOOK',
  'CUSTOM',
] as const;

export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];

export type IntegrationConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING';

export type IntegrationWebhookDirection = 'INCOMING' | 'OUTGOING';

export type IntegrationWebhookDeliveryStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'RETRYING';

export type IntegrationSyncTrigger = 'MANUAL' | 'SCHEDULED' | 'WEBHOOK';

export type IntegrationSyncDirection = 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';

export type IntegrationSyncStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export interface IntegrationCatalogProvider {
  readonly key: IntegrationProviderKey;
  readonly label: string;
  readonly category: IntegrationCategory;
  readonly description: string;
}

export interface IntegrationConnectionRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly providerKey: IntegrationProviderKey;
  readonly displayName: string;
  readonly category: IntegrationCategory;
  readonly status: IntegrationConnectionStatus;
  readonly config: Record<string, unknown>;
  readonly lastSyncAt: string | null;
  readonly lastHealthAt: string | null;
  readonly lastError: string | null;
  readonly healthPayload: unknown;
  readonly rateLimitInfo: unknown;
  readonly isEnabled: boolean;
  readonly hasCredentials?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface IntegrationRateLimitNote {
  readonly connectionId: string;
  readonly providerKey: IntegrationProviderKey;
  readonly displayName?: string;
  readonly info?: unknown;
  readonly message?: string;
}

export interface IntegrationHealthDashboard {
  readonly connected: number;
  readonly disconnected: number;
  readonly error: number;
  readonly pending: number;
  readonly rateLimits: readonly IntegrationRateLimitNote[];
}

export interface IntegrationConnectionHealth {
  readonly connectionId: string;
  readonly status: IntegrationConnectionStatus;
  readonly healthy?: boolean;
  readonly checkedAt?: string;
  readonly message?: string | null;
  readonly details?: unknown;
  readonly rateLimitInfo?: unknown;
}

export interface IntegrationSyncJobRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly connectionId: string;
  readonly trigger: IntegrationSyncTrigger;
  readonly direction: IntegrationSyncDirection;
  readonly status: IntegrationSyncStatus;
  readonly scheduledFor: string | null;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly nextRetryAt: string | null;
  readonly errorMessage: string | null;
  readonly config: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
}

export interface IntegrationSyncLogRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly connectionId: string;
  readonly syncJobId: string | null;
  readonly providerKey: IntegrationProviderKey;
  readonly direction: IntegrationSyncDirection;
  readonly status: IntegrationSyncStatus;
  readonly payload: unknown;
  readonly result: unknown;
  readonly errorMessage: string | null;
  readonly durationMs: number | null;
  readonly retries: number;
  readonly createdAt: string;
}

export interface IntegrationWebhookRecord {
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
  readonly config: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
}

export interface IntegrationWebhookDeliveryRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly webhookId: string;
  readonly direction: IntegrationWebhookDirection;
  readonly status: IntegrationWebhookDeliveryStatus;
  readonly httpStatus: number | null;
  readonly errorMessage: string | null;
  readonly signatureValid: boolean | null;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly nextRetryAt: string | null;
  readonly durationMs: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly finishedAt: string | null;
}

export interface ListIntegrationsParams {
  readonly skip?: number;
  readonly take?: number;
  readonly status?: IntegrationConnectionStatus;
  readonly providerKey?: IntegrationProviderKey;
  readonly connectionId?: string;
  readonly webhookId?: string;
}

export interface ListIntegrationsResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateIntegrationConnectionPayload {
  readonly providerKey: IntegrationProviderKey;
  readonly displayName: string;
  readonly config?: Record<string, unknown>;
}

export interface UpdateIntegrationConnectionPayload {
  readonly displayName?: string;
  readonly config?: Record<string, unknown>;
  readonly isEnabled?: boolean;
}

export interface ConnectIntegrationPayload {
  readonly credentials: Record<string, string>;
}

export interface SyncIntegrationPayload {
  readonly trigger?: IntegrationSyncTrigger;
  readonly direction?: IntegrationSyncDirection;
  readonly config?: Record<string, unknown>;
}

export interface CreateIntegrationWebhookPayload {
  readonly direction: IntegrationWebhookDirection;
  readonly name: string;
  readonly endpointPath?: string | null;
  readonly targetUrl?: string | null;
  readonly signatureHeader?: string | null;
  readonly isActive?: boolean;
  readonly config?: Record<string, unknown>;
  readonly secret?: string;
}

export type UpdateIntegrationWebhookPayload = Partial<CreateIntegrationWebhookPayload>;

export const INTEGRATION_CONNECTION_STATUS_LABELS: Record<IntegrationConnectionStatus, string> = {
  CONNECTED: 'Connected',
  DISCONNECTED: 'Disconnected',
  ERROR: 'Failed',
  PENDING: 'Pending',
};

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  LEADS: 'Leads',
  ADS: 'Ads',
  ANALYTICS: 'Analytics',
  MESSAGING: 'Messaging',
  EMAIL: 'Email',
  PAYMENTS: 'Payments',
  ACCOUNTING: 'Accounting',
  COLLABORATION: 'Collaboration',
  WEBHOOK: 'Webhook',
  CUSTOM: 'Custom',
};

export const INTEGRATION_SYNC_STATUS_LABELS: Record<IntegrationSyncStatus, string> = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  SUCCEEDED: 'Succeeded',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

export const INTEGRATION_SYNC_DIRECTION_LABELS: Record<IntegrationSyncDirection, string> = {
  INBOUND: 'Inbound',
  OUTBOUND: 'Outbound',
  BIDIRECTIONAL: 'Bidirectional',
};

export const INTEGRATION_WEBHOOK_DELIVERY_STATUS_LABELS: Record<
  IntegrationWebhookDeliveryStatus,
  string
> = {
  PENDING: 'Pending',
  SUCCEEDED: 'Succeeded',
  FAILED: 'Failed',
  RETRYING: 'Retrying',
};
