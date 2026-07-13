import type { NotificationCategory, NotificationPriority } from '@prisma/client';

export const NOTIFICATION_EVENT_KEYS = {
  NEW_LEAD_ASSIGNED: 'NEW_LEAD_ASSIGNED',
  NEW_ASSIGNMENT: 'NEW_ASSIGNMENT',
  FOLLOW_UP_DUE: 'FOLLOW_UP_DUE',
  FOLLOW_UP_OVERDUE: 'FOLLOW_UP_OVERDUE',
  MEETING_REMINDER: 'MEETING_REMINDER',
  MEETING_SOON: 'MEETING_SOON',
  PROPOSAL_PENDING: 'PROPOSAL_PENDING',
  PAYMENT_REMINDER: 'PAYMENT_REMINDER',
  RENEWAL_REMINDER: 'RENEWAL_REMINDER',
  DEAL_STAGE_CHANGED: 'DEAL_STAGE_CHANGED',
  DEAL_WON: 'DEAL_WON',
  DEAL_LOST: 'DEAL_LOST',
  DEAL_OWNER_CHANGED: 'DEAL_OWNER_CHANGED',
  DEAL_CLOSE_APPROACHING: 'DEAL_CLOSE_APPROACHING',
  DEAL_OVERDUE: 'DEAL_OVERDUE',
  TASK_DUE: 'TASK_DUE',
  TASK_OVERDUE: 'TASK_OVERDUE',
  PROJECT_TASK_ASSIGNED: 'PROJECT_TASK_ASSIGNED',
  PROJECT_TASK_OVERDUE: 'PROJECT_TASK_OVERDUE',
  PROJECT_MILESTONE_COMPLETED: 'PROJECT_MILESTONE_COMPLETED',
  PROJECT_MILESTONE_OVERDUE: 'PROJECT_MILESTONE_OVERDUE',
  PROJECT_OVERDUE: 'PROJECT_OVERDUE',
} as const;

export type NotificationEventKey =
  (typeof NOTIFICATION_EVENT_KEYS)[keyof typeof NOTIFICATION_EVENT_KEYS];

export interface NotificationEventCatalogEntry {
  readonly key: NotificationEventKey;
  readonly titleTemplate: string;
  readonly bodyTemplate: string;
  readonly category: NotificationCategory;
  readonly defaultPriority: NotificationPriority;
}

export const NOTIFICATION_EVENT_CATALOG: Readonly<
  Record<NotificationEventKey, NotificationEventCatalogEntry>
> = {
  NEW_LEAD_ASSIGNED: {
    key: 'NEW_LEAD_ASSIGNED',
    titleTemplate: 'New lead assigned: {{company}}',
    bodyTemplate: 'You have been assigned to {{company}}{{contactSuffix}}.',
    category: 'SALES',
    defaultPriority: 'HIGH',
  },
  NEW_ASSIGNMENT: {
    key: 'NEW_ASSIGNMENT',
    titleTemplate: 'New assignment: {{title}}',
    bodyTemplate: 'You have been assigned "{{title}}".',
    category: 'SALES',
    defaultPriority: 'HIGH',
  },
  FOLLOW_UP_DUE: {
    key: 'FOLLOW_UP_DUE',
    titleTemplate: 'Follow-up due: {{subject}}',
    bodyTemplate: 'Follow-up "{{subject}}" is due{{dueSuffix}}.',
    category: 'SALES',
    defaultPriority: 'NORMAL',
  },
  FOLLOW_UP_OVERDUE: {
    key: 'FOLLOW_UP_OVERDUE',
    titleTemplate: 'Follow-up overdue: {{subject}}',
    bodyTemplate: 'Follow-up "{{subject}}" is overdue{{dueSuffix}}.',
    category: 'SALES',
    defaultPriority: 'HIGH',
  },
  MEETING_REMINDER: {
    key: 'MEETING_REMINDER',
    titleTemplate: 'Meeting reminder: {{title}}',
    bodyTemplate: 'Reminder for meeting "{{title}}"{{timeSuffix}}.',
    category: 'SALES',
    defaultPriority: 'HIGH',
  },
  MEETING_SOON: {
    key: 'MEETING_SOON',
    titleTemplate: 'Meeting soon: {{title}}',
    bodyTemplate: 'Meeting "{{title}}" starts within the next hour{{timeSuffix}}.',
    category: 'SALES',
    defaultPriority: 'HIGH',
  },
  PROPOSAL_PENDING: {
    key: 'PROPOSAL_PENDING',
    titleTemplate: 'Proposal pending: {{title}}',
    bodyTemplate: 'Proposal "{{title}}" is awaiting action.',
    category: 'SALES',
    defaultPriority: 'NORMAL',
  },
  PAYMENT_REMINDER: {
    key: 'PAYMENT_REMINDER',
    titleTemplate: 'Payment reminder: {{title}}',
    bodyTemplate: 'Payment reminder for "{{title}}"{{amountSuffix}}.',
    category: 'FINANCE',
    defaultPriority: 'HIGH',
  },
  RENEWAL_REMINDER: {
    key: 'RENEWAL_REMINDER',
    titleTemplate: 'Renewal reminder: {{title}}',
    bodyTemplate: 'Renewal reminder for "{{title}}"{{dueSuffix}}.',
    category: 'FINANCE',
    defaultPriority: 'NORMAL',
  },
  DEAL_STAGE_CHANGED: {
    key: 'DEAL_STAGE_CHANGED',
    titleTemplate: 'Deal stage changed: {{title}}',
    bodyTemplate: 'Deal "{{title}}" moved from {{from}} to {{to}}.',
    category: 'SALES',
    defaultPriority: 'NORMAL',
  },
  DEAL_WON: {
    key: 'DEAL_WON',
    titleTemplate: 'Deal won: {{title}}',
    bodyTemplate: 'Deal "{{title}}" was marked as won.',
    category: 'SALES',
    defaultPriority: 'HIGH',
  },
  DEAL_LOST: {
    key: 'DEAL_LOST',
    titleTemplate: 'Deal lost: {{title}}',
    bodyTemplate: 'Deal "{{title}}" was marked as lost.',
    category: 'SALES',
    defaultPriority: 'NORMAL',
  },
  DEAL_OWNER_CHANGED: {
    key: 'DEAL_OWNER_CHANGED',
    titleTemplate: 'Deal assigned: {{title}}',
    bodyTemplate: 'You have been assigned to deal "{{title}}".',
    category: 'SALES',
    defaultPriority: 'HIGH',
  },
  DEAL_CLOSE_APPROACHING: {
    key: 'DEAL_CLOSE_APPROACHING',
    titleTemplate: 'Close date approaching: {{title}}',
    bodyTemplate: 'Deal "{{title}}" is expected to close soon.',
    category: 'SALES',
    defaultPriority: 'HIGH',
  },
  DEAL_OVERDUE: {
    key: 'DEAL_OVERDUE',
    titleTemplate: 'Deal overdue: {{title}}',
    bodyTemplate: 'Deal "{{title}}" is past its expected close date.',
    category: 'SALES',
    defaultPriority: 'HIGH',
  },
  TASK_DUE: {
    key: 'TASK_DUE',
    titleTemplate: 'Task due: {{title}}',
    bodyTemplate: 'Task "{{title}}" is due{{dueSuffix}}.',
    category: 'SALES',
    defaultPriority: 'NORMAL',
  },
  TASK_OVERDUE: {
    key: 'TASK_OVERDUE',
    titleTemplate: 'Task overdue: {{title}}',
    bodyTemplate: 'Task "{{title}}" is overdue{{dueSuffix}}.',
    category: 'SALES',
    defaultPriority: 'HIGH',
  },
  PROJECT_TASK_ASSIGNED: {
    key: 'PROJECT_TASK_ASSIGNED',
    titleTemplate: 'Task assigned: {{title}}',
    bodyTemplate: 'You have been assigned task "{{title}}" on project {{projectName}}.',
    category: 'PROJECT',
    defaultPriority: 'HIGH',
  },
  PROJECT_TASK_OVERDUE: {
    key: 'PROJECT_TASK_OVERDUE',
    titleTemplate: 'Project task overdue: {{title}}',
    bodyTemplate: 'Task "{{title}}" on project {{projectName}} is overdue.',
    category: 'PROJECT',
    defaultPriority: 'HIGH',
  },
  PROJECT_MILESTONE_COMPLETED: {
    key: 'PROJECT_MILESTONE_COMPLETED',
    titleTemplate: 'Milestone completed: {{title}}',
    bodyTemplate: 'Milestone "{{title}}" on project {{projectName}} was completed.',
    category: 'PROJECT',
    defaultPriority: 'NORMAL',
  },
  PROJECT_MILESTONE_OVERDUE: {
    key: 'PROJECT_MILESTONE_OVERDUE',
    titleTemplate: 'Milestone overdue: {{title}}',
    bodyTemplate: 'Milestone "{{title}}" on project {{projectName}} is overdue.',
    category: 'PROJECT',
    defaultPriority: 'HIGH',
  },
  PROJECT_OVERDUE: {
    key: 'PROJECT_OVERDUE',
    titleTemplate: 'Project overdue: {{title}}',
    bodyTemplate: 'Project "{{title}}" is past its target end date.',
    category: 'PROJECT',
    defaultPriority: 'HIGH',
  },
};

export function getNotificationEventCatalogEntry(
  key: string,
): NotificationEventCatalogEntry | null {
  if (Object.prototype.hasOwnProperty.call(NOTIFICATION_EVENT_CATALOG, key)) {
    return NOTIFICATION_EVENT_CATALOG[key as NotificationEventKey];
  }
  return null;
}

export function renderNotificationTemplate(
  template: string,
  vars: Readonly<Record<string, string | number | null | undefined>>,
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, name: string) => {
    const value = vars[name];
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  });
}
