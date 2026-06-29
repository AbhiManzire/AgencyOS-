import { StatusBadge } from '@/design-system';
import type { TaskPriority } from '@/features/tasks/types';

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const PRIORITY_VARIANTS: Record<
  TaskPriority,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  LOW: 'neutral',
  NORMAL: 'primary',
  HIGH: 'warning',
  URGENT: 'danger',
};

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  return (
    <StatusBadge variant={PRIORITY_VARIANTS[priority]}>{PRIORITY_LABELS[priority]}</StatusBadge>
  );
}

export { PRIORITY_LABELS };
