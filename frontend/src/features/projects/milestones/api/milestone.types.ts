export type ProjectMilestoneStatus =
  'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

export interface ProjectMilestoneRecord {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: ProjectMilestoneStatus;
  readonly startDate: string | null;
  readonly dueDate: string | null;
  readonly ownerUserId: string | null;
  readonly ownerDisplayName: string | null;
  readonly ownerEmail: string | null;
  readonly progressPercent: number;
  readonly sortOrder: number;
  readonly completedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkspaceOwnerOption {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly departmentName: string | null;
}

export interface CreateProjectMilestonePayload {
  readonly name: string;
  readonly description?: string;
  readonly status?: ProjectMilestoneStatus;
  readonly startDate?: string;
  readonly dueDate?: string;
  readonly ownerUserId?: string;
}

export interface UpdateProjectMilestonePayload {
  readonly name?: string;
  readonly description?: string | null;
  readonly status?: ProjectMilestoneStatus;
  readonly startDate?: string | null;
  readonly dueDate?: string | null;
  readonly ownerUserId?: string | null;
}

export interface ListProjectMilestonesResult {
  readonly milestones: readonly ProjectMilestoneRecord[];
  readonly availableOwners: readonly WorkspaceOwnerOption[];
}
