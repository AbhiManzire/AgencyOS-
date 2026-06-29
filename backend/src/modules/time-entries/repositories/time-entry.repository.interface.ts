export const TIME_ENTRY_REPOSITORY = Symbol('TIME_ENTRY_REPOSITORY');

export interface TimeEntryScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface TimeEntryTaskScope extends TimeEntryScope {
  readonly taskId: string;
}

export interface TimeEntryRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly userDisplayName: string | null;
  readonly userEmail: string | null;
  readonly startTime: Date;
  readonly endTime: Date | null;
  readonly durationMinutes: number | null;
  readonly isRunning: boolean;
  readonly billable: boolean;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateTimeEntryData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly startTime: Date;
  readonly endTime?: Date | null;
  readonly durationMinutes?: number | null;
  readonly isRunning?: boolean;
  readonly billable: boolean;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateTimeEntryData {
  readonly userId?: string;
  readonly startTime?: Date;
  readonly endTime?: Date;
  readonly durationMinutes?: number | null;
  readonly billable?: boolean;
  readonly notes?: string | null;
  readonly isRunning?: boolean;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteTimeEntryData {
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface TimeEntryRepository {
  create(data: CreateTimeEntryData): Promise<TimeEntryRecord>;
  findById(scope: TimeEntryScope, id: string): Promise<TimeEntryRecord | null>;
  findActiveByUser(scope: TimeEntryScope, userId: string): Promise<TimeEntryRecord | null>;
  listByTask(scope: TimeEntryTaskScope): Promise<readonly TimeEntryRecord[]>;
  update(
    scope: TimeEntryScope,
    id: string,
    data: UpdateTimeEntryData,
  ): Promise<TimeEntryRecord | null>;
  softDelete(
    scope: TimeEntryScope,
    id: string,
    data: SoftDeleteTimeEntryData,
  ): Promise<TimeEntryRecord | null>;
}
