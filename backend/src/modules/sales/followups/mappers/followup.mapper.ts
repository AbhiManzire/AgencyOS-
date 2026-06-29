import type {
  CreateFollowUpCommand,
  UpdateFollowUpCommand,
} from '../services/followup-application.types';
import { CreateFollowUpDto } from '../dto/create-followup.dto';
import { UpdateFollowUpDto } from '../dto/update-followup.dto';

export const FollowUpMapper = {
  toCreateFollowUpCommand(dto: CreateFollowUpDto): CreateFollowUpCommand {
    return {
      subject: dto.subject,
      type: dto.type,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
      reminderAt: dto.reminderAt,
      ownerUserId: dto.ownerUserId,
      status: dto.status,
    };
  },

  toUpdateFollowUpCommand(dto: UpdateFollowUpDto): UpdateFollowUpCommand {
    return {
      subject: dto.subject,
      type: dto.type,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
      reminderAt: dto.reminderAt,
      ownerUserId: dto.ownerUserId,
      status: dto.status,
    };
  },
};
