import type { Prisma } from '@prisma/client';

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
  readonly type: string;
  readonly title: string;
  readonly description: string | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly createdAt: Date;
}

export interface CreateActivityData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly userId?: string | null;
  readonly type: string;
  readonly title: string;
  readonly description?: string | null;
  readonly metadata?: Prisma.InputJsonValue;
  readonly createdAt: Date;
}

export interface ListActivitiesParams {
  readonly scope: ActivityScope;
  readonly entityType?: string;
  readonly entityId?: string;
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
  list(params: ListActivitiesParams): Promise<ListActivitiesResult>;
  listByEntity(
    scope: ActivityScope,
    entityType: string,
    entityId: string,
    pagination?: { skip?: number; take?: number },
  ): Promise<ListActivitiesResult>;
}
