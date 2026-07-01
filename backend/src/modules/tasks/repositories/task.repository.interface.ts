import type { TaskPriority, TaskStatus } from '@prisma/client';

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');

export interface TaskScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface TaskRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly milestoneId: string | null;
  readonly parentTaskId: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly assigneeUserId: string | null;
  readonly assigneeDisplayName: string | null;
  readonly assigneeEmail: string | null;
  readonly startDate: Date | null;
  readonly dueDate: Date | null;
  readonly estimatedHours: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly createdByDisplayName: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
  readonly subtaskCount: number;
}

export interface CreateTaskData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly milestoneId?: string | null;
  readonly parentTaskId?: string | null;
  readonly title: string;
  readonly description?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly estimatedHours?: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateTaskData {
  readonly title?: string;
  readonly description?: string | null;
  readonly milestoneId?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly estimatedHours?: number | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteTaskData {
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface FindTaskByIdOptions {
  readonly includeArchived?: boolean;
}

export interface ListTasksParams {
  readonly scope: TaskScope;
  readonly skip?: number;
  readonly take?: number;
  readonly projectId?: string;
  readonly milestoneId?: string;
  readonly parentTaskId?: string;
  readonly topLevelOnly?: boolean;
  readonly status?: TaskStatus;
  readonly assigneeUserId?: string;
  readonly includeArchived?: boolean;
}

export interface ListTasksResult {
  readonly items: readonly TaskRecord[];
  readonly total: number;
}

export interface TaskRepository {
  create(data: CreateTaskData): Promise<TaskRecord>;
  update(scope: TaskScope, id: string, data: UpdateTaskData): Promise<TaskRecord | null>;
  softDelete(scope: TaskScope, id: string, data: SoftDeleteTaskData): Promise<TaskRecord | null>;
  findById(scope: TaskScope, id: string, options?: FindTaskByIdOptions): Promise<TaskRecord | null>;
  list(params: ListTasksParams): Promise<ListTasksResult>;
  isWorkspaceUser(scope: TaskScope, userId: string): Promise<boolean>;
}
