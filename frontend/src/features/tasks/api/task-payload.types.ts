import type { TaskPriority, TaskStatus, TaskType } from '@/features/tasks/types';

export interface CreateTaskPayload {
  readonly projectId: string;
  readonly milestoneId?: string;
  readonly code?: string;
  readonly title: string;
  readonly description?: string;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly type?: TaskType;
  readonly assigneeUserId?: string;
  readonly reporterUserId?: string;
  readonly startDate?: string;
  readonly dueDate?: string;
  readonly estimatedHours?: number;
  readonly actualHours?: number;
  readonly boardOrder?: number;
}

export interface UpdateTaskPayload {
  readonly title?: string;
  readonly description?: string | null;
  readonly milestoneId?: string | null;
  readonly code?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly type?: TaskType;
  readonly assigneeUserId?: string | null;
  readonly reporterUserId?: string | null;
  readonly startDate?: string | null;
  readonly dueDate?: string | null;
  readonly estimatedHours?: number | null;
  readonly actualHours?: number | null;
  readonly boardOrder?: number;
}
