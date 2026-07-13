import type {
  CreateFollowUpCommand,
  ListFollowUpsQuery,
  UpdateFollowUpCommand,
} from '../services/follow-up-application.types';
import { CreateFollowUpDto } from '../dto/create-follow-up.dto';
import { ListFollowUpsQueryDto } from '../dto/list-follow-ups-query.dto';
import { UpdateFollowUpDto } from '../dto/update-follow-up.dto';

export const FollowUpMapper = {
  toCreateFollowUpCommand(dto: CreateFollowUpDto): CreateFollowUpCommand {
    return {
      entityType: dto.entityType,
      entityId: dto.entityId,
      title: dto.title,
      description: dto.description,
      followUpDate: dto.followUpDate,
      followUpTime: dto.followUpTime,
      priority: dto.priority,
      assignedUserId: dto.assignedUserId,
      reminderType: dto.reminderType,
      recurrence: dto.recurrence,
      ...(dto.metadata !== undefined
        ? { metadata: dto.metadata as CreateFollowUpCommand['metadata'] }
        : {}),
    };
  },

  toUpdateFollowUpCommand(dto: UpdateFollowUpDto): UpdateFollowUpCommand {
    return {
      title: dto.title,
      description: dto.description,
      followUpDate: dto.followUpDate,
      followUpTime: dto.followUpTime,
      priority: dto.priority,
      assignedUserId: dto.assignedUserId,
      reminderType: dto.reminderType,
      recurrence: dto.recurrence,
      ...(dto.metadata !== undefined
        ? { metadata: dto.metadata as UpdateFollowUpCommand['metadata'] }
        : {}),
    };
  },

  toListFollowUpsQuery(dto: ListFollowUpsQueryDto): ListFollowUpsQuery {
    return {
      entityType: dto.entityType,
      entityId: dto.entityId,
      status: dto.status,
      assignedUserId: dto.assignedUserId,
      from: dto.from !== undefined ? new Date(dto.from) : undefined,
      to: dto.to !== undefined ? new Date(dto.to) : undefined,
      skip: dto.skip,
      take: dto.take,
    };
  },
};
