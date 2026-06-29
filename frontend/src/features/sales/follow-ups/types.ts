export type FollowUpType = 'CALL' | 'MEETING' | 'EMAIL' | 'WHATSAPP';

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface FollowUpFormValues {
  subject: string;
  type: FollowUpType;
  scheduledAt: string;
  notes: string;
  reminderAt: string;
  status: FollowUpStatus;
}

export interface FollowUpFormErrors {
  subject?: string;
  type?: string;
  scheduledAt?: string;
  form?: string;
}

export interface FollowUpListItem {
  readonly id: string;
  readonly dealId: string;
  readonly subject: string;
  readonly type: FollowUpType;
  readonly scheduledAt: string;
  readonly notes: string | null;
  readonly reminderAt: string | null;
  readonly ownerUserId: string | null;
  readonly ownerName: string;
  readonly status: FollowUpStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
