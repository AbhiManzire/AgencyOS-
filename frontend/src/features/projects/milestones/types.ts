export type ProjectMilestoneStatus =
  'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

export interface ProjectMilestoneListItem {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: ProjectMilestoneStatus;
  readonly startDate: string | null;
  readonly dueDate: string | null;
  readonly progressPercent: number;
  readonly ownerUserId: string | null;
  readonly ownerDisplayName: string;
  readonly ownerEmail: string;
}

export interface MilestoneFormValues {
  name: string;
  description: string;
  status: ProjectMilestoneStatus;
  startDate: string;
  dueDate: string;
  ownerUserId: string;
}

export interface MilestoneFormErrors {
  name?: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  form?: string;
}

export interface WorkspaceOwnerOption {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly departmentName: string | null;
}
