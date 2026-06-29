import { StatusBadge } from '@/design-system';
import type { ProjectMemberRole } from '@/features/projects/members/types';

const ROLE_LABELS: Record<ProjectMemberRole, string> = {
  LEAD: 'Lead',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

const ROLE_VARIANTS: Record<
  ProjectMemberRole,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  LEAD: 'primary',
  MEMBER: 'neutral',
  VIEWER: 'warning',
};

interface MemberRoleBadgeProps {
  role: ProjectMemberRole;
}

export function MemberRoleBadge({ role }: MemberRoleBadgeProps) {
  return <StatusBadge variant={ROLE_VARIANTS[role]}>{ROLE_LABELS[role]}</StatusBadge>;
}
