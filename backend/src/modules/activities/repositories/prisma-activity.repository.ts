import { Injectable } from '@nestjs/common';
import type { Activity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ActivityRecord,
  ActivityRepository,
  ActivityScope,
  CreateActivityData,
  ListActivitiesParams,
  ListActivitiesResult,
} from './activity.repository.interface';

@Injectable()
export class PrismaActivityRepository implements ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateActivityData): Promise<ActivityRecord> {
    const activity = await this.prisma.activity.create({ data });
    return toActivityRecord(activity);
  }

  async list(params: ListActivitiesParams): Promise<ListActivitiesResult> {
    const { scope, entityType, entityId, skip = 0, take = 25 } = params;

    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(entityType !== undefined ? { entityType } : {}),
      ...(entityId !== undefined ? { entityId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
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
    pagination?: { skip?: number; take?: number },
  ): Promise<ListActivitiesResult> {
    return this.list({
      scope,
      entityType,
      entityId,
      skip: pagination?.skip,
      take: pagination?.take,
    });
  }
}

function toActivityRecord(activity: Activity): ActivityRecord {
  return {
    id: activity.id,
    tenantId: activity.tenantId,
    workspaceId: activity.workspaceId,
    entityType: activity.entityType,
    entityId: activity.entityId,
    userId: activity.userId,
    type: activity.type,
    title: activity.title,
    description: activity.description,
    metadata: activity.metadata,
    createdAt: activity.createdAt,
  };
}
