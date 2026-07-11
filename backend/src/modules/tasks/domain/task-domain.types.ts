import type { TaskPriority, TaskStatus, TaskType } from '@prisma/client';

export const TASK_CREATABLE_STATUSES: readonly TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS'];

export const TASK_STATUSES: readonly TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED',
  'ARCHIVED',
];

export const TASK_PRIORITIES: readonly TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const TASK_TYPES: readonly TaskType[] = [
  'FEATURE',
  'BUG',
  'IMPROVEMENT',
  'RESEARCH',
  'MEETING',
  'SUPPORT',
  'OTHER',
];

export const TASK_TERMINAL_STATUSES: readonly TaskStatus[] = ['COMPLETED', 'CANCELLED'];

export interface CreateTaskValidationInput {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly title: string;
  readonly projectId: string;
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

export interface UpdateTaskValidationInput {
  readonly title?: string;
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
