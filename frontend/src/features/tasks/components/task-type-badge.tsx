import { StatusBadge } from '@/design-system';
import type { TaskType } from '@/features/tasks/types';

export const TYPE_LABELS: Record<TaskType, string> = {
  FEATURE: 'Feature',
  BUG: 'Bug',
  IMPROVEMENT: 'Improvement',
  RESEARCH: 'Research',
  MEETING: 'Meeting',
  SUPPORT: 'Support',
  OTHER: 'Other',
};

interface TaskTypeBadgeProps {
  readonly type: TaskType;
}

export function TaskTypeBadge({ type }: TaskTypeBadgeProps) {
  return <StatusBadge variant="neutral">{TYPE_LABELS[type]}</StatusBadge>;
}
