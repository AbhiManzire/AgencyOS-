import type {
  CreateTaskChecklistItemCommand,
  UpdateTaskChecklistItemCommand,
} from '../services/task-checklist-item-application.types';
import { CreateTaskChecklistItemDto } from '../dto/create-task-checklist-item.dto';
import { UpdateTaskChecklistItemDto } from '../dto/update-task-checklist-item.dto';

/** Maps HTTP DTOs to application commands — no business logic. */
export const TaskChecklistItemMapper = {
  toCreateCommand(dto: CreateTaskChecklistItemDto): CreateTaskChecklistItemCommand {
    return {
      title: dto.title,
      isCompleted: dto.isCompleted,
      sortOrder: dto.sortOrder,
    };
  },

  toUpdateCommand(dto: UpdateTaskChecklistItemDto): UpdateTaskChecklistItemCommand {
    return {
      title: dto.title,
      isCompleted: dto.isCompleted,
      sortOrder: dto.sortOrder,
    };
  },
};
