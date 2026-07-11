import type { TaskPriority, TaskStatus } from '@/features/tasks/types';

export type KanbanColumnStatus =
  'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'COMPLETED';

export interface KanbanColumnDefinition {
  readonly id: KanbanColumnStatus;
  readonly label: string;
  readonly status: KanbanColumnStatus;
}

export const KANBAN_COLUMNS: readonly KanbanColumnDefinition[] = [
  { id: 'BACKLOG', label: 'Backlog', status: 'BACKLOG' },
  { id: 'TODO', label: 'Todo', status: 'TODO' },
  { id: 'IN_PROGRESS', label: 'In Progress', status: 'IN_PROGRESS' },
  { id: 'REVIEW', label: 'Review', status: 'REVIEW' },
  { id: 'BLOCKED', label: 'Blocked', status: 'BLOCKED' },
  { id: 'COMPLETED', label: 'Completed', status: 'COMPLETED' },
] as const;

export const KANBAN_BOARD_STATUSES: readonly KanbanColumnStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'BLOCKED',
  'COMPLETED',
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
  readonly boardOrder: number;
}

export const KANBAN_LIST_PARAMS = {
  take: 100,
  skip: 0,
  sortBy: 'boardOrder' as const,
  sortOrder: 'asc' as const,
};

export const KANBAN_TASK_DRAG_TYPE = 'application/x-agencyos-task-id';
