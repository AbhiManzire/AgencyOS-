export interface TimeEntryListItem {
  readonly id: string;
  readonly taskId: string;
  readonly userId: string;
  readonly userName: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly billable: boolean;
  readonly notes: string | null;
}

export type TimeEntryDrawerMode = 'create' | 'edit';

export interface TimeEntryFormValues {
  readonly userId: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly billable: boolean;
  readonly notes: string;
}

export type TimeEntryFormErrors = Partial<Record<keyof TimeEntryFormValues, string>>;
