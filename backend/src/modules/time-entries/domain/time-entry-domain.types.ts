export interface CreateTimeEntryValidationInput {
  readonly startTime: Date;
  readonly endTime: Date;
}

export interface UpdateTimeEntryValidationInput {
  readonly startTime?: Date;
  readonly endTime?: Date;
}
