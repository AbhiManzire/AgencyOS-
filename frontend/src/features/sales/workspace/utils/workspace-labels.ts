import type { LucideIcon } from 'lucide-react';
import { Bell, Briefcase, CheckSquare, FileText, Phone, Target, Users } from 'lucide-react';
import type {
  SalesTaskPriority,
  SalesTaskStatus,
  SalesTaskType,
} from '@/features/sales/workspace/api/sales-task.types';
import type {
  WorkspaceQueueKind,
  WorkspaceQueuePriority,
} from '@/features/sales/workspace/api/workspace.types';

export const SALES_TASK_TYPE_LABELS: Record<SalesTaskType, string> = {
  CALL: 'Call',
  MEETING: 'Meeting',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  PROPOSAL: 'Proposal',
  DOCUMENTATION: 'Documentation',
  INTERNAL: 'Internal',
  CUSTOM: 'Custom',
};

export const SALES_TASK_STATUS_LABELS: Record<SalesTaskStatus, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  OVERDUE: 'Overdue',
};

export const SALES_TASK_PRIORITY_LABELS: Record<SalesTaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const QUEUE_KIND_LABELS: Record<WorkspaceQueueKind, string> = {
  LEAD_FOLLOW_UP: 'Follow-up',
  CALL: 'Call',
  MEETING: 'Meeting',
  TASK: 'Task',
  REMINDER: 'Reminder',
  DEAL_ACTION: 'Deal',
  PROPOSAL: 'Proposal',
};

export const QUEUE_PRIORITY_LABELS: Record<WorkspaceQueuePriority, string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const QUEUE_PRIORITY_VARIANTS: Record<
  WorkspaceQueuePriority,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  URGENT: 'danger',
  HIGH: 'warning',
  MEDIUM: 'primary',
  LOW: 'neutral',
};

export const SALES_TASK_TYPES: readonly SalesTaskType[] = [
  'CALL',
  'MEETING',
  'EMAIL',
  'WHATSAPP',
  'PROPOSAL',
  'DOCUMENTATION',
  'INTERNAL',
  'CUSTOM',
];

export const SALES_TASK_PRIORITIES: readonly SalesTaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

const QUEUE_KIND_ICONS: Record<WorkspaceQueueKind, LucideIcon> = {
  LEAD_FOLLOW_UP: Target,
  CALL: Phone,
  MEETING: Users,
  TASK: CheckSquare,
  REMINDER: Bell,
  DEAL_ACTION: Briefcase,
  PROPOSAL: FileText,
};

const TASK_TYPE_ICONS: Record<SalesTaskType, LucideIcon> = {
  CALL: Phone,
  MEETING: Users,
  EMAIL: FileText,
  WHATSAPP: Phone,
  PROPOSAL: FileText,
  DOCUMENTATION: FileText,
  INTERNAL: CheckSquare,
  CUSTOM: CheckSquare,
};

/** Returns an icon component for a queue item kind. */
export function getQueueKindIcon(kind: WorkspaceQueueKind): LucideIcon {
  return QUEUE_KIND_ICONS[kind];
}

/** Returns an icon component for a sales task type. */
export function getSalesTaskTypeIcon(type: SalesTaskType): LucideIcon {
  return TASK_TYPE_ICONS[type];
}

/** Formats an ISO datetime for display in the local timezone. */
export function formatWorkspaceDateTime(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** Formats a YYYY-MM-DD (or ISO date) for display. */
export function formatWorkspaceDate(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '—';
  }

  const dateOnly = value.slice(0, 10);
  const date = new Date(`${dateOnly}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date);
}

/** Returns today's date as YYYY-MM-DD in local time. */
export function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

/** Formats a ratio (0–1) as a percentage string. */
export function formatWorkspacePercent(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) {
    return '—';
  }

  return `${(ratio * 100).toFixed(1)}%`;
}
