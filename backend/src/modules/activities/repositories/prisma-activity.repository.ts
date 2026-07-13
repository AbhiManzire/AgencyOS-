import { Injectable } from '@nestjs/common';
import { Prisma, type Activity, type User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ActivityRecord,
  ActivityRepository,
  ActivityScope,
  CreateActivityData,
  ListActivitiesParams,
  ListActivitiesResult,
} from './activity.repository.interface';

type ActivityWithUser = Activity & {
  user: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'> | null;
};

const userInclude = {
  user: {
    select: {
      displayName: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

@Injectable()
export class PrismaActivityRepository implements ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateActivityData): Promise<ActivityRecord> {
    try {
      const activity = await this.prisma.activity.create({
        data: {
          id: data.id,
          tenantId: data.tenantId,
          workspaceId: data.workspaceId,
          entityType: data.entityType,
          entityId: data.entityId,
          userId: data.userId ?? null,
          type: data.type,
          origin: data.origin,
          title: data.title,
          description: data.description ?? null,
          metadata: data.metadata,
          dedupeKey: data.dedupeKey ?? null,
          createdAt: data.createdAt,
        },
        include: userInclude,
      });

      return toActivityRecord(activity);
    } catch (error) {
      if (
        data.dedupeKey &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.findByDedupeKey(
          { tenantId: data.tenantId, workspaceId: data.workspaceId },
          data.dedupeKey,
        );
        if (existing !== null) {
          return existing;
        }
      }

      throw error;
    }
  }

  async findByDedupeKey(scope: ActivityScope, dedupeKey: string): Promise<ActivityRecord | null> {
    const activity = await this.prisma.activity.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        dedupeKey,
      },
      include: userInclude,
    });

    return activity ? toActivityRecord(activity) : null;
  }

  async list(params: ListActivitiesParams): Promise<ListActivitiesResult> {
    const {
      scope,
      entityType,
      entityId,
      type,
      types,
      userId,
      origin,
      createdFrom,
      createdTo,
      skip = 0,
      take = 25,
    } = params;

    const where: Prisma.ActivityWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(entityType !== undefined ? { entityType } : {}),
      ...(entityId !== undefined ? { entityId } : {}),
      ...(types !== undefined && types.length > 0
        ? { type: { in: [...types] } }
        : type !== undefined
          ? { type }
          : {}),
      ...(userId !== undefined ? { userId } : {}),
      ...(origin !== undefined ? { origin } : {}),
      ...(createdFrom !== undefined || createdTo !== undefined
        ? {
            createdAt: {
              ...(createdFrom !== undefined ? { gte: createdFrom } : {}),
              ...(createdTo !== undefined ? { lte: createdTo } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: userInclude,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      items: items.map(toActivityRecord),
      total,
    };
  }

  async listByEntity(
    scope: ActivityScope,
    entityType: string,
    entityId: string,
    pagination?: {
      skip?: number;
      take?: number;
      type?: ListActivitiesParams['type'];
      types?: ListActivitiesParams['types'];
      userId?: string;
      origin?: ListActivitiesParams['origin'];
      createdFrom?: Date;
      createdTo?: Date;
    },
  ): Promise<ListActivitiesResult> {
    return this.list({
      scope,
      entityType,
      entityId,
      skip: pagination?.skip,
      take: pagination?.take,
      type: pagination?.type,
      types: pagination?.types,
      userId: pagination?.userId,
      origin: pagination?.origin,
      createdFrom: pagination?.createdFrom,
      createdTo: pagination?.createdTo,
    });
  }
}

function toActivityRecord(activity: ActivityWithUser): ActivityRecord {
  return {
    id: activity.id,
    tenantId: activity.tenantId,
    workspaceId: activity.workspaceId,
    entityType: activity.entityType,
    entityId: activity.entityId,
    userId: activity.userId,
    userDisplayName: resolveUserDisplayName(activity.user),
    userEmail: activity.user?.email ?? null,
    type: activity.type,
    origin: activity.origin,
    title: activity.title,
    description: activity.description,
    metadata: activity.metadata,
    dedupeKey: activity.dedupeKey,
    createdAt: activity.createdAt,
  };
}

function resolveUserDisplayName(
  user: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'> | null,
): string | null {
  if (user === null) {
    return null;
  }

  if (user.displayName !== null && user.displayName.trim().length > 0) {
    return user.displayName.trim();
  }

  const name = [user.firstName, user.lastName]
    .filter((part): part is string => part !== null && part.trim().length > 0)
    .join(' ')
    .trim();

  if (name.length > 0) {
    return name;
  }

  return user.email;
}
