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
      type: dto.type,
      title: dto.title,
      description: dto.description,
      ...(dto.metadata !== undefined
        ? { metadata: dto.metadata as CreateActivityCommand['metadata'] }
        : {}),
    };
  },

  toListActivitiesQuery(dto: ListActivitiesQueryDto): ListActivitiesQuery {
    return {
      entityType: dto.entityType,
      entityId: dto.entityId,
      skip: dto.skip,
      take: dto.take,
    };
  },
};
