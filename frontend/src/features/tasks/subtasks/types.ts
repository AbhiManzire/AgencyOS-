import type { TaskPriority, TaskStatus } from '@/features/tasks/types';

export interface SubtaskListItem {
  readonly id: string;
  readonly title: string;
  readonly assigneeUserId: string | null;
  readonly assigneeName: string;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly dueDate: string | null;
}

export interface SubtaskFormValues {
  title: string;
  assigneeUserId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
}

export interface SubtaskFormErrors {
  title?: string;
  dueDate?: string;
  form?: string;
}

export type SubtaskDrawerMode = 'create' | 'edit';
