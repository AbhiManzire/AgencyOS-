export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type TaskListStatusFilter = 'all' | TaskStatus;

export type TaskListPriorityFilter = 'all' | TaskPriority;

export interface TaskListItem {
  readonly id: string;
  readonly title: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly milestoneId: string | null;
  readonly milestoneName: string;
  readonly assigneeUserId: string | null;
  readonly assigneeName: string;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly dueDate: string | null;
}
