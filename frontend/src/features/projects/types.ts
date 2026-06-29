export type ProjectStatus =
  'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'INVOICE_READY' | 'CANCELLED';

export type ProjectPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type ProjectMemberRole = 'LEAD' | 'MEMBER' | 'VIEWER';

export type ProjectMemberStatus = 'ACTIVE' | 'INACTIVE';

export type ProjectMilestoneStatus =
  'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

export type ProjectSortField = 'name' | 'status' | 'priority' | 'targetEndDate' | 'updatedAt';

export type SortDirection = 'asc' | 'desc';

export type ProjectListStatusFilter = 'all' | ProjectStatus;

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
  readonly updatedAt: string;
}
