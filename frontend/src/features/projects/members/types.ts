export type ProjectMemberRole =
  | 'MANAGER'
  | 'DEVELOPER'
  | 'DESIGNER'
  | 'SEO'
  | 'MARKETING'
  | 'QA'
  | 'ACCOUNTS'
  | 'CUSTOM'
  | 'VIEWER';
export type ProjectMemberStatus = 'ACTIVE' | 'INACTIVE';

export interface ProjectMemberListItem {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly userDisplayName: string;
  readonly userEmail: string;
  readonly role: ProjectMemberRole;
  readonly customRoleLabel: string | null;
  readonly departmentName: string;
  readonly assignedOn: string;
  readonly allocationPercent: number | null;
  readonly status: ProjectMemberStatus;
}

export interface MemberFormValues {
  userId: string;
  role: ProjectMemberRole;
  customRoleLabel: string;
  allocationPercent: string;
  startDate: string;
}

export interface MemberFormErrors {
  userId?: string;
  customRoleLabel?: string;
  allocationPercent?: string;
  startDate?: string;
  form?: string;
}

export interface WorkspaceUserOption {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly departmentName: string | null;
}
