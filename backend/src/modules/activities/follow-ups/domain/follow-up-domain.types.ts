export const FOLLOW_UP_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface CreateFollowUpValidationInput {
  readonly title: string;
  readonly followUpDate: string;
  readonly followUpTime: string;
  readonly assignedUserId: string;
  readonly entityType: string;
  readonly entityId: string;
}

export interface UpdateFollowUpValidationInput {
  readonly title?: string;
  readonly followUpDate?: string;
  readonly followUpTime?: string;
  readonly assignedUserId?: string;
}
