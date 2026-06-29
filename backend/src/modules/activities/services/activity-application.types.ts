import type { Prisma } from '@prisma/client';

export interface ActivityApplicationContext {
  readonly actorUserId: string;
}

export interface CreateActivityCommand {
  readonly entityType: string;
  readonly entityId: string;
  readonly type: string;
  readonly title: string;
  readonly description?: string;
  readonly metadata?: Prisma.InputJsonValue;
}

export interface ListActivitiesQuery {
  readonly entityType?: string;
  readonly entityId?: string;
  readonly skip?: number;
  readonly take?: number;
}
