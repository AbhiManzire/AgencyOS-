import type { TimeEntryRecord } from '../repositories/time-entry.repository.interface';

export interface TimeEntryApplicationContext {
  readonly actorUserId: string;
}

export interface CreateTimeEntryCommand {
  readonly userId?: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly billable?: boolean;
  readonly notes?: string | null;
}

export interface UpdateTimeEntryCommand {
  readonly userId?: string;
  readonly startTime?: Date;
  readonly endTime?: Date;
  readonly billable?: boolean;
  readonly notes?: string | null;
}

export interface StopTimeEntryCommand {
  readonly billable?: boolean;
  readonly notes?: string | null;
}

export interface StartTimeEntryCommand {
  readonly billable?: boolean;
}

export type { TimeEntryRecord };
