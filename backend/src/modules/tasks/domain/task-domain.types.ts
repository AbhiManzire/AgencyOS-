import type { TaskPriority, TaskStatus } from '@prisma/client';

export const TASK_CREATABLE_STATUSES: readonly TaskStatus[] = ['TODO', 'IN_PROGRESS'];

export const TASK_STATUSES: readonly TaskStatus[] = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'CANCELLED',
];

export const TASK_PRIORITIES: readonly TaskPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export interface CreateTaskValidationInput {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly title: string;
  readonly projectId: string;
  readonly milestoneId?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly estimatedHours?: number | null;
}

export interface UpdateTaskValidationInput {
  readonly title?: string;
  readonly milestoneId?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly startDate?: Date | null;
  readonly dueDate?: Date | null;
  readonly estimatedHours?: number | null;
}

export interface CreateSubtaskValidationInput {
  readonly title: string;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly dueDate?: Date | null;
}

export interface UpdateSubtaskValidationInput {
  readonly title?: string;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly dueDate?: Date | null;
}
