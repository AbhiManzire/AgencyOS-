import { StatusBadge } from '@/design-system';
import type { ProjectMemberRole } from '@/features/projects/members/types';

const ROLE_LABELS: Record<ProjectMemberRole, string> = {
  MANAGER: 'Manager',
  DEVELOPER: 'Developer',
  DESIGNER: 'Designer',
  SEO: 'SEO',
  MARKETING: 'Marketing',
  QA: 'QA',
  ACCOUNTS: 'Accounts',
  CUSTOM: 'Custom',
  VIEWER: 'Viewer',
};

const ROLE_VARIANTS: Record<
  ProjectMemberRole,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  MANAGER: 'primary',
  DEVELOPER: 'neutral',
  DESIGNER: 'success',
  SEO: 'warning',
  MARKETING: 'warning',
  QA: 'warning',
  ACCOUNTS: 'neutral',
  CUSTOM: 'primary',
  VIEWER: 'neutral',
};

interface MemberRoleBadgeProps {
  role: ProjectMemberRole;
  customRoleLabel?: string | null;
}

export function MemberRoleBadge({ role, customRoleLabel }: MemberRoleBadgeProps) {
  const label =
    role === 'CUSTOM' && customRoleLabel && customRoleLabel.trim().length > 0
      ? customRoleLabel
      : ROLE_LABELS[role];

  return <StatusBadge variant={ROLE_VARIANTS[role]}>{label}</StatusBadge>;
}
