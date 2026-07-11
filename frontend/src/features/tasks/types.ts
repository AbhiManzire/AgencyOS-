export type TaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskType =
  'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'RESEARCH' | 'MEETING' | 'SUPPORT' | 'OTHER';

export type TaskListStatusFilter = 'all' | TaskStatus;

export type TaskListPriorityFilter = 'all' | TaskPriority;

export type TaskListArchivedFilter = 'active' | 'archived' | 'all';

export type TaskListDueFilter = 'all' | 'overdue' | 'dueToday' | 'dueThisWeek';

export type TaskSortField =
  'updatedAt' | 'dueDate' | 'priority' | 'status' | 'title' | 'boardOrder' | 'createdAt';

export type SortDirection = 'asc' | 'desc';

export interface TaskListItem {
  readonly id: string;
  readonly code: string | null;
  readonly title: string;
  readonly type: TaskType;
  readonly projectId: string;
  readonly projectName: string;
  readonly milestoneId: string | null;
  readonly milestoneName: string;
  readonly assigneeUserId: string | null;
  readonly assigneeName: string;
  readonly reporterUserId: string | null;
  readonly reporterName: string;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly dueDate: string | null;
  readonly isArchived: boolean;
}
