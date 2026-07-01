import type { ListTasksParams } from '@/features/tasks/api/task.types';
import type { TaskListStatusFilter } from '@/features/tasks/types';

/** Backend max page size — list UI filters and paginates within this window. */
const LIST_FETCH_TAKE = 100;

interface ResolvedListTasksQuery {
  readonly params: ListTasksParams;
  readonly usesClientSideListProcessing: boolean;
}

/** Maps UI filter values to GET /tasks query parameters. */
export function resolveListTasksQuery(
  statusFilter: TaskListStatusFilter,
  _assigneeFilter: string,
  _page: number,
  _pageSize: number,
): ResolvedListTasksQuery {
  return {
    params: {
      skip: 0,
      take: LIST_FETCH_TAKE,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    },
    usesClientSideListProcessing: true,
  };
}
