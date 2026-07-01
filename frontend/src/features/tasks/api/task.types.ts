import type { TaskPriority, TaskStatus } from '@/features/tasks/types';

/** Task row returned by GET /tasks — mirrors backend TaskRecord. */
export interface TaskRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly milestoneId: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly assigneeUserId: string | null;
  readonly assigneeDisplayName: string | null;
  readonly assigneeEmail: string | null;
  readonly startDate: string | null;
  readonly dueDate: string | null;
  readonly estimatedHours: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly createdByDisplayName: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
  readonly subtaskCount: number;
}

export interface ListTasksParams {
  readonly skip?: number;
  readonly take?: number;
  readonly projectId?: string;
  readonly milestoneId?: string;
  readonly status?: TaskStatus;
  readonly assigneeUserId?: string;
  readonly includeArchived?: boolean;
}

export interface ListTasksResult {
  readonly items: readonly TaskRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}
