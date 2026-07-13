import type {
  CreateReminderCommand,
  ListRemindersQuery,
  UpdateReminderCommand,
} from '../services/reminder-application.types';
import { CreateReminderDto } from '../dto/create-reminder.dto';
import { ListRemindersQueryDto } from '../dto/list-reminders-query.dto';
import { UpdateReminderDto } from '../dto/update-reminder.dto';

/** Maps HTTP DTOs to application commands and queries — no business logic. */
export const ReminderMapper = {
  toCreateReminderCommand(dto: CreateReminderDto): CreateReminderCommand {
    return {
      title: dto.title,
      body: dto.body,
      remindDate: dto.remindDate,
      remindTime: dto.remindTime,
      recurrence: dto.recurrence,
      assignedUserId: dto.assignedUserId,
      notificationEventKey: dto.notificationEventKey,
      entityType: dto.entityType,
      entityId: dto.entityId,
      metadata: dto.metadata,
    };
  },

  toUpdateReminderCommand(dto: UpdateReminderDto): UpdateReminderCommand {
    return {
      title: dto.title,
      body: dto.body,
      remindDate: dto.remindDate,
      remindTime: dto.remindTime,
      recurrence: dto.recurrence,
      assignedUserId: dto.assignedUserId,
      notificationEventKey: dto.notificationEventKey,
      entityType: dto.entityType,
      entityId: dto.entityId,
      status: dto.status,
      metadata: dto.metadata,
    };
  },

  toListRemindersQuery(dto: ListRemindersQueryDto): ListRemindersQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      status: dto.status,
      assignedUserId: dto.assignedUserId,
      entityType: dto.entityType,
      entityId: dto.entityId,
    };
  },
};
