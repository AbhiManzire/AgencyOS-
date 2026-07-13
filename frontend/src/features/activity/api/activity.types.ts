export type ActivityType =
  | 'LEAD_CREATED'
  | 'LEAD_UPDATED'
  | 'OWNER_CHANGED'
  | 'CALL'
  | 'EMAIL'
  | 'WHATSAPP'
  | 'SMS'
  | 'MEETING'
  | 'NOTE'
  | 'TASK'
  | 'FOLLOW_UP'
  | 'PROPOSAL_SENT'
  | 'QUOTE_SENT'
  | 'INVOICE_SENT'
  | 'PAYMENT_RECEIVED'
  | 'REMINDER'
  | 'STATUS_CHANGED'
  | 'PIPELINE_CHANGED'
  | 'TAG_ADDED'
  | 'ATTACHMENT_UPLOADED'
  | 'DOCUMENT_SHARED'
  | 'DEAL_WON'
  | 'DEAL_LOST'
  | 'CLIENT_CONVERTED'
  | 'PROJECT_CREATED'
  | 'CUSTOM';

export type ActivityOrigin = 'SYSTEM' | 'MANUAL';

export interface ActivityRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly userId: string | null;
  readonly userDisplayName: string | null;
  readonly userEmail: string | null;
  readonly type: ActivityType;
  readonly origin: ActivityOrigin;
  readonly title: string;
  readonly description: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly dedupeKey: string | null;
  readonly createdAt: string;
}

export interface ActivityTypeCatalogEntry {
  readonly value: ActivityType;
  readonly label: string;
  readonly isManual: boolean;
}

export interface ActivityTypesCatalog {
  readonly types: readonly ActivityTypeCatalogEntry[];
  readonly manualTypes: readonly ActivityType[];
}

export interface ListActivitiesFilters {
  readonly entityType?: string;
  readonly entityId?: string;
  readonly type?: ActivityType;
  readonly types?: readonly ActivityType[];
  readonly userId?: string;
  readonly origin?: ActivityOrigin;
  readonly createdFrom?: string;
  readonly createdTo?: string;
  readonly skip?: number;
  readonly take?: number;
}

export interface ListActivitiesParams extends ListActivitiesFilters {
  readonly entityType: string;
  readonly entityId: string;
}

export type ListWorkspaceActivitiesParams = ListActivitiesFilters;

export interface ListActivitiesResult {
  readonly items: readonly ActivityRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateActivityPayload {
  readonly entityType: string;
  readonly entityId: string;
  readonly type: ActivityType;
  readonly title: string;
  readonly description?: string;
  readonly origin?: ActivityOrigin;
  readonly metadata?: Record<string, unknown>;
  readonly dedupeKey?: string;
}

export const ACTIVITY_TYPE_LABELS: Readonly<Record<ActivityType, string>> = {
  LEAD_CREATED: 'Lead created',
  LEAD_UPDATED: 'Lead updated',
  OWNER_CHANGED: 'Owner changed',
  CALL: 'Call',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  MEETING: 'Meeting',
  NOTE: 'Note',
  TASK: 'Task',
  FOLLOW_UP: 'Follow-up',
  PROPOSAL_SENT: 'Proposal sent',
  QUOTE_SENT: 'Quote sent',
  INVOICE_SENT: 'Invoice sent',
  PAYMENT_RECEIVED: 'Payment received',
  REMINDER: 'Reminder',
  STATUS_CHANGED: 'Status changed',
  PIPELINE_CHANGED: 'Pipeline changed',
  TAG_ADDED: 'Tag added',
  ATTACHMENT_UPLOADED: 'Attachment uploaded',
  DOCUMENT_SHARED: 'Document shared',
  DEAL_WON: 'Deal won',
  DEAL_LOST: 'Deal lost',
  CLIENT_CONVERTED: 'Client converted',
  PROJECT_CREATED: 'Project created',
  CUSTOM: 'Custom',
};

export const MANUAL_ACTIVITY_TYPES: readonly ActivityType[] = [
  'CALL',
  'MEETING',
  'NOTE',
  'FOLLOW_UP',
  'EMAIL',
  'WHATSAPP',
  'CUSTOM',
] as const;
