import type { AiConversationStatus, AiMessageRole, AiProviderKind, Prisma } from '@prisma/client';

export interface AiScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface AiActorContext {
  readonly actorUserId: string | null;
}

export interface PaginationParams {
  readonly skip: number;
  readonly take: number;
}

export const DEFAULT_PAGINATION: PaginationParams = {
  skip: 0,
  take: 25,
};

export const MAX_PAGE_SIZE = 100;

export interface FeatureFlagRecord {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  readonly enabled: boolean;
  readonly metadata: Prisma.JsonValue | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AiSettingsRecord {
  readonly id: string;
  readonly enabled: boolean;
  readonly defaultProviderKind: AiProviderKind | null;
  readonly defaultModel: string | null;
  readonly maxTokensPerRequest: number;
  readonly monthlyTokenBudget: number | null;
  readonly auditPrompts: boolean;
  readonly preferences: Prisma.JsonValue;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AiProviderConfigRecord {
  readonly id: string;
  readonly kind: AiProviderKind;
  readonly name: string;
  readonly isDefault: boolean;
  readonly isEnabled: boolean;
  readonly baseUrl: string | null;
  readonly model: string | null;
  readonly apiKeyEnvRef: string | null;
  readonly hasEncryptedApiKey: boolean;
  readonly config: Prisma.JsonValue;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AiPromptTemplateRecord {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  readonly systemPrompt: string;
  readonly userPromptTemplate: string;
  readonly version: number;
  readonly isActive: boolean;
  readonly metadata: Prisma.JsonValue | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AiConversationRecord {
  readonly id: string;
  readonly ownerUserId: string;
  readonly title: string | null;
  readonly status: AiConversationStatus;
  readonly providerKind: AiProviderKind | null;
  readonly model: string | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AiMessageRecord {
  readonly id: string;
  readonly conversationId: string;
  readonly role: AiMessageRole;
  readonly content: string;
  readonly tokenCount: number | null;
  readonly createdByUserId: string | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly createdAt: string;
}

export interface AiUsageSummary {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  readonly eventCount: number;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
}

export interface RenderedPrompt {
  readonly systemPrompt: string;
  readonly userPrompt: string;
}
