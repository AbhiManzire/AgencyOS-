import type { TaskPriority, TaskSortField, TaskStatus, TaskType } from '@/features/tasks/types';

/** Task row returned by GET /tasks — mirrors backend TaskRecord (ISO date strings). */
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
  readonly startDate: string | null;
  readonly dueDate: string | null;
  readonly estimatedHours: number | null;
  readonly actualHours: number | null;
  readonly completedAt: string | null;
  readonly boardOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly createdByDisplayName: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
  readonly subtaskCount: number;
}

export type TaskSortBy = TaskSortField;
export type TaskSortOrder = 'asc' | 'desc';

export interface ListTasksParams {
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
  readonly dueFrom?: string;
  readonly dueTo?: string;
  readonly includeArchived?: boolean;
  readonly archivedOnly?: boolean;
  readonly sortBy?: TaskSortBy;
  readonly sortOrder?: TaskSortOrder;
}

export interface ListTasksResult {
  readonly items: readonly TaskRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface TaskDependencyRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly taskId: string;
  readonly dependsOnTaskId: string;
  readonly dependsOnTitle: string;
  readonly dependsOnStatus: TaskStatus;
  readonly createdAt: string;
}

export interface CreateTaskDependencyPayload {
  readonly dependsOnTaskId: string;
}

export interface TaskTagRecord {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: string;
}

export interface AssignTaskTagPayload {
  readonly name: string;
  readonly colorToken?: string | null;
}
