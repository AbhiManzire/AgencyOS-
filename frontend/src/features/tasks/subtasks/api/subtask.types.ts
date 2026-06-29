import type { TaskPriority, TaskStatus } from '@/features/tasks/types';

/** Subtask row returned by GET /tasks/:id/subtasks. */
export interface SubtaskRecord {
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
  readonly startDate: string | null;
  readonly dueDate: string | null;
  readonly estimatedHours: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface CreateSubtaskPayload {
  readonly title: string;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly dueDate?: string | null;
}

export interface UpdateSubtaskPayload {
  readonly title?: string;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly dueDate?: string | null;
}

export interface ListSubtasksResult {
  readonly subtasks: readonly SubtaskRecord[];
}
