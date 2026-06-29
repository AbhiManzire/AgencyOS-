import type { CreateSubtaskDto } from '../dto/create-subtask.dto';
import type { UpdateSubtaskDto } from '../dto/update-subtask.dto';
import type {
  CreateSubtaskCommand,
  UpdateSubtaskCommand,
} from '../services/task-application.types';

export const TaskSubtaskMapper = {
  toCreateSubtaskCommand(dto: CreateSubtaskDto): CreateSubtaskCommand {
    return {
      title: dto.title,
      status: dto.status,
      priority: dto.priority,
      assigneeUserId: dto.assigneeUserId,
      dueDate: dto.dueDate,
    };
  },

  toUpdateSubtaskCommand(dto: UpdateSubtaskDto): UpdateSubtaskCommand {
    return {
      title: dto.title,
      status: dto.status,
      priority: dto.priority,
      assigneeUserId: dto.assigneeUserId,
      dueDate: dto.dueDate,
    };
  },
};
