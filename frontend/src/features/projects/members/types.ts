export type ProjectMemberRole = 'LEAD' | 'MEMBER' | 'VIEWER';
export type ProjectMemberStatus = 'ACTIVE' | 'INACTIVE';

export interface ProjectMemberListItem {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly userDisplayName: string;
  readonly userEmail: string;
  readonly role: ProjectMemberRole;
  readonly departmentName: string;
  readonly assignedOn: string;
  readonly allocationPercent: number | null;
  readonly status: ProjectMemberStatus;
}

export interface MemberFormValues {
  userId: string;
  role: ProjectMemberRole;
  allocationPercent: string;
  startDate: string;
}

export interface MemberFormErrors {
  userId?: string;
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
