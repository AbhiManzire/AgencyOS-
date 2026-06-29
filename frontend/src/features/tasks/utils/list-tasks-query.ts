import type { ListTasksParams } from '@/features/tasks/api/task.types';
import type { TaskListStatusFilter } from '@/features/tasks/types';

interface ResolvedListTasksQuery {
  readonly params: ListTasksParams;
}

/** Maps UI filter values to GET /tasks query parameters. */
export function resolveListTasksQuery(
  statusFilter: TaskListStatusFilter,
  assigneeFilter: string,
  page: number,
  pageSize: number,
): ResolvedListTasksQuery {
  return {
    params: {
      skip: (page - 1) * pageSize,
      take: pageSize,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(assigneeFilter !== 'all' && assigneeFilter !== 'unassigned'
        ? { assigneeUserId: assigneeFilter }
        : {}),
    },
  };
}
