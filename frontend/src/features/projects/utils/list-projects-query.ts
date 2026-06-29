import type { ListProjectsParams } from '@/features/projects/api/project.types';
import type { ProjectListStatusFilter } from '@/features/projects/types';

interface ResolvedListProjectsQuery {
  readonly params: ListProjectsParams;
}

/** Maps UI status filter values to GET /projects query parameters. */
export function resolveListProjectsQuery(
  statusFilter: ProjectListStatusFilter,
  page: number,
  pageSize: number,
): ResolvedListProjectsQuery {
  return {
    params: {
      skip: (page - 1) * pageSize,
      take: pageSize,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    },
  };
}
