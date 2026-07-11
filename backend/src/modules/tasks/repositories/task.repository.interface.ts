import type { TaskPriority, TaskStatus, TaskType } from '@prisma/client';

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');
export const TASK_DEPENDENCY_REPOSITORY = Symbol('TASK_DEPENDENCY_REPOSITORY');
export const TASK_TAG_REPOSITORY = Symbol('TASK_TAG_REPOSITORY');

export interface TaskScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export type TaskSortBy =
  'updatedAt' | 'dueDate' | 'priority' | 'status' | 'title' | 'boardOrder' | 'createdAt';

export type TaskSortOrder = 'asc' | 'desc';

export interface TaskRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly clientId: string | null;
  readonly milestoneId: string | null;
  readonly parentTaskId: string | null;
  readonly code: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly type: TaskType;
  readonly assigneeUserId: string | null;
  readonly assigneeDisplayName: string | null;
  readonly assigneeEmail: string | null;
  readonly reporterUserId: string | null;
  readonly reporterDisplayName: string | null;
  readonly reporterEmail: string | null;
  readonly startDate: Date | null;
  readonly dueDate: Date | null;
  readonly estimatedHours: number | null;
  readonly actualHours: number | null;
  readonly completedAt: Date | null;
  readonly boardOrder: number;
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
  readonly completedAt?: Date | null;
  readonly boardOrder?: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateTaskData {
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
  readonly completedAt?: Date | null;
  readonly boardOrder?: number;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteTaskData {
  readonly status: TaskStatus;
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface RestoreTaskData {
  readonly status: TaskStatus;
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

export interface ListTasksResult {
  readonly items: readonly TaskRecord[];
  readonly total: number;
}

export interface TaskRepository {
  create(data: CreateTaskData): Promise<TaskRecord>;
  update(scope: TaskScope, id: string, data: UpdateTaskData): Promise<TaskRecord | null>;
  softDelete(scope: TaskScope, id: string, data: SoftDeleteTaskData): Promise<TaskRecord | null>;
  restore(scope: TaskScope, id: string, data: RestoreTaskData): Promise<TaskRecord | null>;
  findById(scope: TaskScope, id: string, options?: FindTaskByIdOptions): Promise<TaskRecord | null>;
  findByCode(scope: TaskScope, code: string): Promise<TaskRecord | null>;
  list(params: ListTasksParams): Promise<ListTasksResult>;
  countOpenSubtasks(scope: TaskScope, parentTaskId: string): Promise<number>;
  isWorkspaceUser(scope: TaskScope, userId: string): Promise<boolean>;
}

export interface TaskDependencyRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly taskId: string;
  readonly dependsOnTaskId: string;
  readonly dependsOnTitle: string;
  readonly dependsOnStatus: TaskStatus;
  readonly createdAt: Date;
}

export interface CreateTaskDependencyData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly taskId: string;
  readonly dependsOnTaskId: string;
  readonly createdAt: Date;
}

export interface TaskDependencyRepository {
  listBlockedBy(scope: TaskScope, taskId: string): Promise<readonly TaskDependencyRecord[]>;
  create(data: CreateTaskDependencyData): Promise<TaskDependencyRecord>;
  delete(scope: TaskScope, taskId: string, dependencyId: string): Promise<boolean>;
  exists(scope: TaskScope, taskId: string, dependsOnTaskId: string): Promise<boolean>;
  wouldCreateCycle(scope: TaskScope, taskId: string, dependsOnTaskId: string): Promise<boolean>;
  hasIncompleteBlockedBy(scope: TaskScope, taskId: string): Promise<boolean>;
}

export interface TaskTagRecord {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: Date;
}

export interface TaskTagScope {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly taskId: string;
}

export interface EnsureTagData {
  readonly id: string;
  readonly name: string;
  readonly colorToken?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface TaskTagRepository {
  listByTask(scope: TaskTagScope): Promise<readonly TaskTagRecord[]>;
  findTagByName(
    scope: Pick<TaskTagScope, 'tenantId' | 'workspaceId'>,
    name: string,
  ): Promise<{
    id: string;
    name: string;
    colorToken: string | null;
    description: string | null;
  } | null>;
  createTag(
    scope: Pick<TaskTagScope, 'tenantId' | 'workspaceId'>,
    data: EnsureTagData,
  ): Promise<{ id: string; name: string; colorToken: string | null; description: string | null }>;
  isAssigned(scope: TaskTagScope, tagId: string): Promise<boolean>;
  assign(scope: TaskTagScope, tagId: string, assignedAt: Date): Promise<TaskTagRecord>;
  unassign(scope: TaskTagScope, tagId: string): Promise<boolean>;
}
