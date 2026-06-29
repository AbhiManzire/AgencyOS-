import type {
  CreateTaskCommand,
  ListTasksQuery,
  UpdateTaskCommand,
} from '../services/task-application.types';
import { CreateTaskDto } from '../dto/create-task.dto';
import { ListTasksQueryDto } from '../dto/list-tasks-query.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

export const TaskMapper = {
  toCreateTaskCommand(dto: CreateTaskDto): CreateTaskCommand {
    return {
      projectId: dto.projectId,
      milestoneId: dto.milestoneId,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      assigneeUserId: dto.assigneeUserId,
      startDate: dto.startDate,
      dueDate: dto.dueDate,
      estimatedHours: dto.estimatedHours,
    };
  },

  toUpdateTaskCommand(dto: UpdateTaskDto): UpdateTaskCommand {
    return {
      title: dto.title,
      description: dto.description,
      milestoneId: dto.milestoneId,
      status: dto.status,
      priority: dto.priority,
      assigneeUserId: dto.assigneeUserId,
      startDate: dto.startDate,
      dueDate: dto.dueDate,
      estimatedHours: dto.estimatedHours,
    };
  },

  toListTasksQuery(dto: ListTasksQueryDto): ListTasksQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      projectId: dto.projectId,
      milestoneId: dto.milestoneId,
      status: dto.status,
      assigneeUserId: dto.assigneeUserId,
      includeArchived: dto.includeArchived,
    };
  },
};
