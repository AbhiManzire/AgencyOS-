import { StatusBadge } from '@/design-system';
import type { TaskStatus } from '@/features/tasks/types';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ARCHIVED: 'Archived',
};

const STATUS_VARIANTS: Record<
  TaskStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  BACKLOG: 'neutral',
  TODO: 'neutral',
  IN_PROGRESS: 'primary',
  REVIEW: 'warning',
  BLOCKED: 'danger',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  ARCHIVED: 'neutral',
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return <StatusBadge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</StatusBadge>;
}
