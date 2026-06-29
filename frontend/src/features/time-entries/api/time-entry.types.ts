/** Time entry row returned by the time entries API. */
export interface TimeEntryRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly taskId: string;
  readonly userId: string;
  readonly userDisplayName: string | null;
  readonly userEmail: string | null;
  readonly startTime: string;
  readonly endTime: string | null;
  readonly durationMinutes: number | null;
  readonly isRunning: boolean;
  readonly billable: boolean;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListTaskTimeEntriesResult {
  readonly entries: readonly TimeEntryRecord[];
}

export interface CreateTimeEntryPayload {
  readonly userId?: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly billable?: boolean;
  readonly notes?: string | null;
}

export interface UpdateTimeEntryPayload {
  readonly userId?: string;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly billable?: boolean;
  readonly notes?: string | null;
}

export interface StartTimeEntryPayload {
  readonly billable?: boolean;
}

export interface StopTimeEntryPayload {
  readonly billable?: boolean;
  readonly notes?: string | null;
}

export interface ActiveTimeEntryRecord extends TimeEntryRecord {
  readonly isRunning: true;
  readonly endTime: null;
  readonly durationMinutes: null;
}
