import { StatusBadge } from '@/design-system';
import type { TaskPriority } from '@/features/tasks/types';

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const PRIORITY_VARIANTS: Record<
  TaskPriority,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  LOW: 'neutral',
  MEDIUM: 'primary',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  return (
    <StatusBadge variant={PRIORITY_VARIANTS[priority]}>{PRIORITY_LABELS[priority]}</StatusBadge>
  );
}
