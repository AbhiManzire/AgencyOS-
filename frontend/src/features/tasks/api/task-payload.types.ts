import type { TaskPriority, TaskStatus } from '@/features/tasks/types';

export interface CreateTaskPayload {
  readonly projectId: string;
  readonly milestoneId?: string;
  readonly title: string;
  readonly description?: string;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string;
  readonly startDate?: string;
  readonly dueDate?: string;
  readonly estimatedHours?: number;
}

export interface UpdateTaskPayload {
  readonly title?: string;
  readonly description?: string | null;
  readonly milestoneId?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assigneeUserId?: string | null;
  readonly startDate?: string | null;
  readonly dueDate?: string | null;
  readonly estimatedHours?: number | null;
}
