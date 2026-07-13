import type { ActivityOrigin, ActivityType, Prisma } from '@prisma/client';

export interface ActivityApplicationContext {
  readonly actorUserId: string;
}

export interface CreateActivityCommand {
  readonly entityType: string;
  readonly entityId: string;
  readonly type: ActivityType;
  readonly title: string;
  readonly description?: string;
  readonly metadata?: Prisma.InputJsonValue;
  readonly origin?: ActivityOrigin;
  readonly dedupeKey?: string;
}

export interface LogSystemEventCommand {
  readonly entityType: string;
  readonly entityId: string;
  readonly type: ActivityType;
  readonly title?: string;
  readonly description?: string;
  readonly metadata?: Prisma.InputJsonValue;
  readonly dedupeKey?: string;
}

export interface LogManualActivityCommand {
  readonly entityType: string;
  readonly entityId: string;
  readonly type: ActivityType;
  readonly title: string;
  readonly description?: string;
  readonly metadata?: Prisma.InputJsonValue;
  readonly dedupeKey?: string;
}

export interface ListActivitiesQuery {
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

export interface ActivityTypeCatalogEntry {
  readonly value: ActivityType;
  readonly label: string;
  readonly isManual: boolean;
}

export interface ActivityTypesCatalog {
  readonly types: readonly ActivityTypeCatalogEntry[];
  readonly manualTypes: readonly ActivityType[];
}
