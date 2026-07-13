import type { ActivityType } from '@prisma/client';
import type {
  CreateActivityCommand,
  ListActivitiesQuery,
} from '../services/activity-application.types';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { ListActivitiesQueryDto } from '../dto/list-activities-query.dto';

/** Maps HTTP DTOs to application commands and queries — no business logic. */
export const ActivityMapper = {
  toCreateActivityCommand(dto: CreateActivityDto): CreateActivityCommand {
    return {
      entityType: dto.entityType,
      entityId: dto.entityId,
      type: dto.type as ActivityType,
      title: dto.title,
      description: dto.description,
      origin: dto.origin,
      dedupeKey: dto.dedupeKey,
      ...(dto.metadata !== undefined
        ? { metadata: dto.metadata as CreateActivityCommand['metadata'] }
        : {}),
    };
  },

  toListActivitiesQuery(dto: ListActivitiesQueryDto): ListActivitiesQuery {
    return {
      entityType: dto.entityType,
      entityId: dto.entityId,
      type: dto.type,
      types: dto.types,
      userId: dto.userId,
      origin: dto.origin,
      createdFrom: dto.createdFrom !== undefined ? new Date(dto.createdFrom) : undefined,
      createdTo: dto.createdTo !== undefined ? new Date(dto.createdTo) : undefined,
      skip: dto.skip,
      take: dto.take,
    };
  },
};
