import type { ListProjectsParams } from '@/features/projects/api/project.types';
import type { ProjectListStatusFilter } from '@/features/projects/types';

const LIST_FETCH_TAKE = 100;

interface ResolvedListProjectsQuery {
  readonly params: ListProjectsParams;
  readonly usesClientSideListProcessing: boolean;
}

/** Maps UI status filter values to GET /projects query parameters. */
export function resolveListProjectsQuery(
  statusFilter: ProjectListStatusFilter,
  _page: number,
  _pageSize: number,
): ResolvedListProjectsQuery {
  return {
    params: {
      skip: 0,
      take: LIST_FETCH_TAKE,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    },
    usesClientSideListProcessing: true,
  };
}
