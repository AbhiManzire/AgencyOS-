import { StatusBadge } from '@/design-system';
import type { TaskStatus } from '@/features/tasks/types';

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

const STATUS_VARIANTS: Record<
  TaskStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  TODO: 'neutral',
  IN_PROGRESS: 'primary',
  IN_REVIEW: 'warning',
  DONE: 'success',
  CANCELLED: 'danger',
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return <StatusBadge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</StatusBadge>;
}
