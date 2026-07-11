import { StatusBadge } from '@/design-system';
import type { ProjectStatus } from '@/features/projects/types';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  INVOICE_READY: 'Invoice Ready',
  CANCELLED: 'Cancelled',
  ARCHIVED: 'Archived',
};

const STATUS_VARIANTS: Record<
  ProjectStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  PLANNING: 'primary',
  ACTIVE: 'success',
  ON_HOLD: 'warning',
  COMPLETED: 'neutral',
  INVOICE_READY: 'success',
  CANCELLED: 'danger',
  ARCHIVED: 'neutral',
};

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return <StatusBadge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</StatusBadge>;
}
