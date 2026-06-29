import type { TaskPriority, TaskStatus } from '@prisma/client';
import type {
  ListTasksResult,
  TaskRecord,
  TaskScope,
} from '../repositories/task.repository.interface';

export interface TaskApplicationContext {
  readonly actorUserId: string;
}

export interface CreateTaskCommand {
  readonly projectId: string;
  readonly milestoneId?: string | null;
  readonly title: string;
  readonly description?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly estimatedHours?: number | null;
}

export interface UpdateTaskCommand {
  readonly title?: string;
  readonly description?: string | null;
  readonly milestoneId?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly estimatedHours?: number | null;
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
  readonly assigneeUserId?: string;
  readonly includeArchived?: boolean;
}

export type { ListTasksResult, TaskRecord, TaskScope };
