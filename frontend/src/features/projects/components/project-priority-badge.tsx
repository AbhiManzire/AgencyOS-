import { StatusBadge } from '@/design-system';
import type { ProjectPriority } from '@/features/projects/types';

const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const PRIORITY_VARIANTS: Record<
  ProjectPriority,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  LOW: 'neutral',
  NORMAL: 'primary',
  HIGH: 'warning',
  URGENT: 'danger',
};

interface ProjectPriorityBadgeProps {
  readonly priority: ProjectPriority;
}

export function ProjectPriorityBadge({ priority }: ProjectPriorityBadgeProps) {
  return (
    <StatusBadge variant={PRIORITY_VARIANTS[priority]}>{PRIORITY_LABELS[priority]}</StatusBadge>
  );
}
