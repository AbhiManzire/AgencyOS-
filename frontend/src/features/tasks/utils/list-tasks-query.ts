import type { ListTasksParams } from '@/features/tasks/api/task.types';
import type {
  SortDirection,
  TaskListArchivedFilter,
  TaskListDueFilter,
  TaskListPriorityFilter,
  TaskListStatusFilter,
  TaskSortField,
} from '@/features/tasks/types';

interface ResolveListTasksQueryInput {
  readonly statusFilter: TaskListStatusFilter;
  readonly priorityFilter: TaskListPriorityFilter;
  readonly archivedFilter: TaskListArchivedFilter;
  readonly dueFilter: TaskListDueFilter;
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly projectId?: string;
  readonly assigneeUserId?: string;
  readonly reporterUserId?: string;
  readonly sortField?: TaskSortField;
  readonly sortDirection?: SortDirection;
}

interface ResolvedListTasksQuery {
  readonly params: ListTasksParams;
  readonly usesClientSideListProcessing: false;
}

function toDateOnlyIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/** Maps due-date UI presets to dueFrom/dueTo ISO date bounds. */
function resolveDueRange(dueFilter: TaskListDueFilter): {
  readonly dueFrom?: string;
  readonly dueTo?: string;
} {
  const today = startOfLocalDay(new Date());

  switch (dueFilter) {
    case 'overdue': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { dueTo: toDateOnlyIso(yesterday) };
    }
    case 'dueToday':
      return { dueFrom: toDateOnlyIso(today), dueTo: toDateOnlyIso(today) };
    case 'dueThisWeek': {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + (6 - weekEnd.getDay()));
      return {
        dueFrom: toDateOnlyIso(today),
        dueTo: toDateOnlyIso(endOfLocalDay(weekEnd)),
      };
    }
    case 'all':
      return {};
  }
}

/** Maps UI list controls to GET /tasks query parameters (server-side). */
export function resolveListTasksQuery({
  statusFilter,
  priorityFilter,
  archivedFilter,
  dueFilter,
  page,
  pageSize,
  search,
  projectId,
  assigneeUserId,
  reporterUserId,
  sortField = 'updatedAt',
  sortDirection = 'desc',
}: ResolveListTasksQueryInput): ResolvedListTasksQuery {
  const skip = Math.max(0, (page - 1) * pageSize);
  const take = Math.min(100, Math.max(1, pageSize));
  const q = search?.trim() ?? '';
  const dueRange = resolveDueRange(dueFilter);

  const base: ListTasksParams = {
    skip,
    take,
    sortBy: sortField,
    sortOrder: sortDirection,
    ...(q.length > 0 ? { q } : {}),
    ...(projectId !== undefined && projectId.length > 0 ? { projectId } : {}),
    ...(assigneeUserId !== undefined && assigneeUserId.length > 0 ? { assigneeUserId } : {}),
    ...(reporterUserId !== undefined && reporterUserId.length > 0 ? { reporterUserId } : {}),
    ...(priorityFilter !== 'all' ? { priority: priorityFilter } : {}),
    ...dueRange,
  };

  if (archivedFilter === 'archived') {
    return {
      params: {
        ...base,
        archivedOnly: true,
        includeArchived: true,
      },
      usesClientSideListProcessing: false,
    };
  }

  if (archivedFilter === 'all') {
    return {
      params: {
        ...base,
        includeArchived: true,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      },
      usesClientSideListProcessing: false,
    };
  }

  return {
    params: {
      ...base,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    },
    usesClientSideListProcessing: false,
  };
}

/** Returns true when a task record is archived. */
export function isTaskArchived(task: {
  readonly deletedAt?: string | null;
  readonly isArchived?: boolean;
  readonly status?: string;
}): boolean {
  if (task.isArchived !== undefined) {
    return task.isArchived;
  }

  if (task.status === 'ARCHIVED') {
    return true;
  }

  return task.deletedAt !== null && task.deletedAt !== undefined;
}
