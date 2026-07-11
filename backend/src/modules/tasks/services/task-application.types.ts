import type { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import type {
  ListTasksResult,
  TaskRecord,
  TaskScope,
  TaskSortBy,
  TaskSortOrder,
} from '../repositories/task.repository.interface';

export interface TaskApplicationContext {
  readonly actorUserId: string;
}

export interface CreateTaskCommand {
  readonly projectId: string;
  readonly milestoneId?: string | null;
  readonly code?: string | null;
  readonly title: string;
  readonly description?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly type?: TaskType;
  readonly assigneeUserId?: string | null;
  readonly reporterUserId?: string | null;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly estimatedHours?: number | null;
  readonly actualHours?: number | null;
  readonly boardOrder?: number;
}

export interface UpdateTaskCommand {
  readonly title?: string;
  readonly description?: string | null;
  readonly milestoneId?: string | null;
  readonly code?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly type?: TaskType;
  readonly assigneeUserId?: string | null;
  readonly reporterUserId?: string | null;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly estimatedHours?: number | null;
  readonly actualHours?: number | null;
  readonly boardOrder?: number;
}

export interface CreateSubtaskCommand {
  readonly title: string;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly dueDate?: Date | null;
}

export interface UpdateSubtaskCommand {
  readonly title?: string;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly dueDate?: Date | null;
}

export interface GetTaskOptions {
  readonly includeArchived?: boolean;
}

export interface ListTasksQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly projectId?: string;
  readonly milestoneId?: string;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly type?: TaskType;
  readonly assigneeUserId?: string;
  readonly reporterUserId?: string;
  readonly q?: string;
  readonly dueFrom?: Date;
  readonly dueTo?: Date;
  readonly boardOrderFrom?: number;
  readonly boardOrderTo?: number;
  readonly includeArchived?: boolean;
  readonly archivedOnly?: boolean;
  readonly sortBy?: TaskSortBy;
  readonly sortOrder?: TaskSortOrder;
}

export type { ListTasksResult, TaskRecord, TaskScope };
