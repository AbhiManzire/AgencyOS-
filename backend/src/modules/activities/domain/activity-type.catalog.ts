import { ActivityType } from '@prisma/client';

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
  CLIENT_MERGED: 'Clients merged',
  PROJECT_CREATED: 'Project created',
  MILESTONE_COMPLETED: 'Milestone completed',
  TASK_ASSIGNED: 'Task assigned',
  RENEWAL_CREATED: 'Renewal created',
  RENEWAL_UPDATED: 'Renewal updated',
  RENEWAL_DUE: 'Renewal due',
  CUSTOM: 'Custom',
};

export const MANUAL_ACTIVITY_TYPES: readonly ActivityType[] = [
  ActivityType.CALL,
  ActivityType.MEETING,
  ActivityType.NOTE,
  ActivityType.FOLLOW_UP,
  ActivityType.EMAIL,
  ActivityType.WHATSAPP,
  ActivityType.CUSTOM,
] as const;

export const MANUAL_ACTIVITY_TYPE_SET: ReadonlySet<ActivityType> = new Set(MANUAL_ACTIVITY_TYPES);

/** Maps legacy dotted activity type strings to ActivityType enum values. */
export const LEGACY_ACTIVITY_TYPE_MAP: Readonly<Record<string, ActivityType>> = {
  'lead.created': ActivityType.LEAD_CREATED,
  'lead.imported': ActivityType.LEAD_CREATED,
  'lead.updated': ActivityType.LEAD_UPDATED,
  'lead.status_changed': ActivityType.STATUS_CHANGED,
  'lead.assigned': ActivityType.OWNER_CHANGED,
  'lead.converted': ActivityType.CLIENT_CONVERTED,
  'lead.tag_assigned': ActivityType.TAG_ADDED,
  'lead.archived': ActivityType.CUSTOM,
  'lead.restored': ActivityType.CUSTOM,
  'deal.created': ActivityType.CUSTOM,
  'deal.updated': ActivityType.CUSTOM,
  'deal.stage_changed': ActivityType.PIPELINE_CHANGED,
  'deal.assigned': ActivityType.OWNER_CHANGED,
  'deal.won': ActivityType.DEAL_WON,
  'deal.lost': ActivityType.DEAL_LOST,
  'deal.archived': ActivityType.CUSTOM,
  'deal.restored': ActivityType.CUSTOM,
  'deal.converted_to_project': ActivityType.PROJECT_CREATED,
  'deal.converted_to_invoice': ActivityType.INVOICE_SENT,
  'quote.sent': ActivityType.QUOTE_SENT,
  'proposal.sent': ActivityType.PROPOSAL_SENT,
  'invoice.sent': ActivityType.INVOICE_SENT,
  'invoice.email.sent': ActivityType.INVOICE_SENT,
  'payment.received': ActivityType.PAYMENT_RECEIVED,
  'project.created': ActivityType.PROJECT_CREATED,
  'project.milestone_completed': ActivityType.MILESTONE_COMPLETED,
  'task.assigned': ActivityType.TASK_ASSIGNED,
  'task.reassigned': ActivityType.TASK_ASSIGNED,
  'client.created': ActivityType.CUSTOM,
  'client.updated': ActivityType.CUSTOM,
  'client.archived': ActivityType.CUSTOM,
  'client.restored': ActivityType.CUSTOM,
  'task.created': ActivityType.TASK,
  'task.updated': ActivityType.TASK,
  'task.completed': ActivityType.TASK,
  'task.status_changed': ActivityType.STATUS_CHANGED,
  'task.archived': ActivityType.CUSTOM,
  'task.restored': ActivityType.CUSTOM,
};

const ACTIVITY_TYPE_SET: ReadonlySet<string> = new Set(Object.values(ActivityType));

export function resolveActivityType(raw: string): ActivityType {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return ActivityType.CUSTOM;
  }

  if (ACTIVITY_TYPE_SET.has(trimmed)) {
    return trimmed as ActivityType;
  }

  if (Object.hasOwn(LEGACY_ACTIVITY_TYPE_MAP, trimmed)) {
    return LEGACY_ACTIVITY_TYPE_MAP[trimmed];
  }

  const upper = trimmed.toUpperCase().replace(/\./g, '_');
  if (ACTIVITY_TYPE_SET.has(upper)) {
    return upper as ActivityType;
  }

  return ActivityType.CUSTOM;
}

export function defaultTitleForType(type: ActivityType): string {
  return ACTIVITY_TYPE_LABELS[type];
}

export function isManualActivityType(type: ActivityType): boolean {
  return MANUAL_ACTIVITY_TYPE_SET.has(type);
}
