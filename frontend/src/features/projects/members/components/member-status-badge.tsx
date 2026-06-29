import { StatusBadge } from '@/design-system';
import type { ProjectMemberStatus } from '@/features/projects/members/types';

const STATUS_LABELS: Record<ProjectMemberStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

const STATUS_VARIANTS: Record<
  ProjectMemberStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

interface MemberStatusBadgeProps {
  status: ProjectMemberStatus;
}

export function MemberStatusBadge({ status }: MemberStatusBadgeProps) {
  return <StatusBadge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</StatusBadge>;
}
