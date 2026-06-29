import { StatusBadge } from '@/design-system';
import type { ProjectMilestoneStatus } from '@/features/projects/milestones/types';

const STATUS_LABELS: Record<ProjectMilestoneStatus, string> = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
};

const STATUS_VARIANTS: Record<
  ProjectMilestoneStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  PLANNED: 'neutral',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  ON_HOLD: 'warning',
  CANCELLED: 'danger',
};

interface MilestoneStatusBadgeProps {
  status: ProjectMilestoneStatus;
}

export function MilestoneStatusBadge({ status }: MilestoneStatusBadgeProps) {
  return <StatusBadge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</StatusBadge>;
}
