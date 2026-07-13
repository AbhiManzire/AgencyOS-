import type { ActivityOrigin, ActivityType, Prisma } from '@prisma/client';

/** Tenant and workspace scope required on every activity repository operation. */
export interface ActivityScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface ActivityRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly userId: string | null;
  readonly userDisplayName: string | null;
  readonly userEmail: string | null;
  readonly type: ActivityType;
  readonly origin: ActivityOrigin;
  readonly title: string;
  readonly description: string | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly dedupeKey: string | null;
  readonly createdAt: Date;
}

export interface CreateActivityData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly userId?: string | null;
  readonly type: ActivityType;
  readonly origin: ActivityOrigin;
  readonly title: string;
  readonly description?: string | null;
  readonly metadata?: Prisma.InputJsonValue;
  readonly dedupeKey?: string | null;
  readonly createdAt: Date;
}

export interface ListActivitiesParams {
  readonly scope: ActivityScope;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly type?: ActivityType;
  readonly types?: readonly ActivityType[];
  readonly userId?: string;
  readonly origin?: ActivityOrigin;
  readonly createdFrom?: Date;
  readonly createdTo?: Date;
  readonly skip?: number;
  readonly take?: number;
}

export interface ListActivitiesResult {
  readonly items: readonly ActivityRecord[];
  readonly total: number;
}

export const ACTIVITY_REPOSITORY = Symbol('ACTIVITY_REPOSITORY');

export interface ActivityRepository {
  create(data: CreateActivityData): Promise<ActivityRecord>;
  findByDedupeKey(scope: ActivityScope, dedupeKey: string): Promise<ActivityRecord | null>;
  list(params: ListActivitiesParams): Promise<ListActivitiesResult>;
  listByEntity(
    scope: ActivityScope,
    entityType: string,
    entityId: string,
    pagination?: {
      skip?: number;
      take?: number;
      type?: ActivityType;
      types?: readonly ActivityType[];
      userId?: string;
      origin?: ActivityOrigin;
      createdFrom?: Date;
      createdTo?: Date;
    },
  ): Promise<ListActivitiesResult>;
}
