/** Mirrors backend WorkspaceCountCard. */
export interface WorkspaceCountCard {
  readonly count: number;
}

/** Mirrors backend WorkspaceDashboardWidgets. */
export interface WorkspaceDashboardWidgets {
  readonly todaysRevenueTarget: number | null;
  readonly currentPipeline: number;
  readonly tasksCompletedToday: number;
  readonly callsCompletedToday: number;
  readonly meetingsCompletedToday: number;
  readonly leadConversionRate: number | null;
  readonly dealWinRate: number | null;
}

/** Mirrors backend WorkspaceDashboardResult. */
export interface WorkspaceDashboardResult {
  readonly todaysTasks: WorkspaceCountCard;
  readonly todaysCalls: WorkspaceCountCard;
  readonly todaysMeetings: WorkspaceCountCard;
  readonly todaysFollowUps: WorkspaceCountCard;
  readonly overdue: WorkspaceCountCard;
  readonly assignedLeads: WorkspaceCountCard;
  readonly assignedDeals: WorkspaceCountCard;
  readonly dealsClosingThisWeek: WorkspaceCountCard;
  readonly upcomingReminders: WorkspaceCountCard;
  readonly unreadNotifications: number;
  readonly widgets: WorkspaceDashboardWidgets;
}

export type WorkspaceQueueKind =
  'LEAD_FOLLOW_UP' | 'CALL' | 'MEETING' | 'TASK' | 'REMINDER' | 'DEAL_ACTION' | 'PROPOSAL';

export type WorkspaceQueueSourceType =
  'sales_task' | 'follow_up' | 'reminder' | 'deal' | 'proposal';

export type WorkspaceQueuePriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Mirrors backend WorkspaceQueueItem. */
export interface WorkspaceQueueItem {
  readonly id: string;
  readonly kind: WorkspaceQueueKind;
  readonly title: string;
  readonly priority: WorkspaceQueuePriority;
  readonly dueAt: string | null;
  readonly status: string;
  readonly sourceType: WorkspaceQueueSourceType;
  readonly sourceId: string;
  readonly leadId?: string | null;
  readonly dealId?: string | null;
  readonly clientId?: string | null;
  readonly deepLink?: string;
}

export interface WorkspaceQueueResult {
  readonly items: readonly WorkspaceQueueItem[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface ListWorkspaceQueueParams {
  readonly skip?: number;
  readonly take?: number;
}

export type WorkspaceCalendarView = 'month' | 'week' | 'day' | 'agenda';

/** Mirrors backend WorkspaceCalendarEvent. */
export interface WorkspaceCalendarEvent {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly startAt: string;
  readonly endAt?: string | null;
  readonly entityType?: string | null;
  readonly entityId?: string | null;
  readonly sourceType: WorkspaceQueueSourceType | 'activity';
  readonly sourceId: string;
  readonly priority?: WorkspaceQueuePriority | null;
}

export interface WorkspaceCalendarResult {
  readonly events: readonly WorkspaceCalendarEvent[];
  readonly view: WorkspaceCalendarView;
  readonly from: string;
  readonly to: string;
}

export interface WorkspaceCalendarParams {
  readonly view?: WorkspaceCalendarView;
  readonly from?: string;
  readonly to?: string;
}

export type QuickActionType =
  | 'complete_task'
  | 'reschedule_task'
  | 'reassign_task'
  | 'add_note'
  | 'log_call'
  | 'start_meeting'
  | 'send_email'
  | 'send_whatsapp'
  | 'convert_lead'
  | 'open_deal';

export interface QuickActionPayload {
  readonly action: QuickActionType;
  readonly taskId?: string;
  readonly leadId?: string;
  readonly dealId?: string;
  readonly clientId?: string;
  readonly dueDate?: string;
  readonly dueTime?: string | null;
  readonly ownerUserId?: string;
  readonly note?: string;
  readonly title?: string;
  readonly description?: string;
}

export interface QuickActionResult {
  readonly ok: true;
  readonly result: unknown;
}
