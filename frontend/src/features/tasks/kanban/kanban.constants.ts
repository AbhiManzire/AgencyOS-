import type { TaskPriority, TaskStatus } from '@/features/tasks/types';

export type KanbanColumnStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface KanbanColumnDefinition {
  readonly id: KanbanColumnStatus;
  readonly label: string;
  readonly status: KanbanColumnStatus;
}

export const KANBAN_COLUMNS: readonly KanbanColumnDefinition[] = [
  { id: 'TODO', label: 'Todo', status: 'TODO' },
  { id: 'IN_PROGRESS', label: 'In Progress', status: 'IN_PROGRESS' },
  { id: 'IN_REVIEW', label: 'Review', status: 'IN_REVIEW' },
  { id: 'DONE', label: 'Done', status: 'DONE' },
] as const;

export const KANBAN_BOARD_STATUSES: readonly KanbanColumnStatus[] = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
];

export interface KanbanTaskCard {
  readonly id: string;
  readonly title: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly assigneeUserId: string | null;
  readonly assigneeName: string;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly dueDate: string | null;
  readonly subtaskCount: number;
}

export const KANBAN_LIST_PARAMS = {
  take: 200,
  skip: 0,
} as const;

export const KANBAN_TASK_DRAG_TYPE = 'application/x-agencyos-task-id';
