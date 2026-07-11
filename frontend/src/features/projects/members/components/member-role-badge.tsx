import { StatusBadge } from '@/design-system';
import type { ProjectMemberRole } from '@/features/projects/members/types';

const ROLE_LABELS: Record<ProjectMemberRole, string> = {
  MANAGER: 'Manager',
  DEVELOPER: 'Developer',
  DESIGNER: 'Designer',
  QA: 'QA',
  VIEWER: 'Viewer',
};

const ROLE_VARIANTS: Record<
  ProjectMemberRole,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  MANAGER: 'primary',
  DEVELOPER: 'neutral',
  DESIGNER: 'success',
  QA: 'warning',
  VIEWER: 'neutral',
};

interface MemberRoleBadgeProps {
  role: ProjectMemberRole;
}

export function MemberRoleBadge({ role }: MemberRoleBadgeProps) {
  return <StatusBadge variant={ROLE_VARIANTS[role]}>{ROLE_LABELS[role]}</StatusBadge>;
}
