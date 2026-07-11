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
      code: dto.code,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      type: dto.type,
      assigneeUserId: dto.assigneeUserId,
      reporterUserId: dto.reporterUserId,
      startDate: dto.startDate,
      dueDate: dto.dueDate,
      estimatedHours: dto.estimatedHours,
      actualHours: dto.actualHours,
      boardOrder: dto.boardOrder,
    };
  },

  toUpdateTaskCommand(dto: UpdateTaskDto): UpdateTaskCommand {
    return {
      title: dto.title,
      description: dto.description,
      milestoneId: dto.milestoneId,
      code: dto.code,
      status: dto.status,
      priority: dto.priority,
      type: dto.type,
      assigneeUserId: dto.assigneeUserId,
      reporterUserId: dto.reporterUserId,
      startDate: dto.startDate,
      dueDate: dto.dueDate,
      estimatedHours: dto.estimatedHours,
      actualHours: dto.actualHours,
      boardOrder: dto.boardOrder,
    };
  },

  toListTasksQuery(dto: ListTasksQueryDto): ListTasksQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      projectId: dto.projectId,
      milestoneId: dto.milestoneId,
      status: dto.status,
      priority: dto.priority,
      type: dto.type,
      assigneeUserId: dto.assigneeUserId,
      reporterUserId: dto.reporterUserId,
      q: dto.q,
      dueFrom: dto.dueFrom,
      dueTo: dto.dueTo,
      boardOrderFrom: dto.boardOrderFrom,
      boardOrderTo: dto.boardOrderTo,
      includeArchived: dto.includeArchived,
      archivedOnly: dto.archivedOnly,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };
  },
};
