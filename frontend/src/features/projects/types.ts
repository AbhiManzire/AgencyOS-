export type ProjectStatus =
  'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'INVOICE_READY' | 'CANCELLED' | 'ARCHIVED';

export type ProjectPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type ProjectMemberRole = 'MANAGER' | 'DEVELOPER' | 'DESIGNER' | 'QA' | 'VIEWER';

export type ProjectMemberStatus = 'ACTIVE' | 'INACTIVE';

export type ProjectMilestoneStatus =
  'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

export type ProjectSortField =
  'name' | 'status' | 'priority' | 'targetEndDate' | 'updatedAt' | 'createdAt';

export type ProjectServerSortField = ProjectSortField;

export type SortDirection = 'asc' | 'desc';

export type ProjectListStatusFilter = 'all' | 'archived' | ProjectStatus;

export interface WorkspaceOwnerOption {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
}

export interface DepartmentOption {
  readonly id: string;
  readonly name: string;
}

export interface ProjectListItem {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly status: ProjectStatus;
  readonly priority: ProjectPriority;
  readonly projectManager: string;
  readonly targetEndDate: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isArchived: boolean;
}
