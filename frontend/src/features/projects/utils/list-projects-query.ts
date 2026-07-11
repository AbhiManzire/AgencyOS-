import type { ListProjectsParams } from '@/features/projects/api/project.types';
import type {
  ProjectListStatusFilter,
  ProjectPriority,
  ProjectServerSortField,
  ProjectSortField,
  SortDirection,
} from '@/features/projects/types';

interface ResolveListProjectsQueryInput {
  readonly statusFilter: ProjectListStatusFilter;
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly projectManagerUserId?: string;
  readonly clientId?: string;
  readonly departmentId?: string;
  readonly priority?: ProjectPriority | 'all';
  readonly sortField?: ProjectSortField;
  readonly sortDirection?: SortDirection;
}

interface ResolvedListProjectsQuery {
  readonly params: ListProjectsParams;
  readonly usesClientSideListProcessing: false;
}

/** Maps UI sort field to a server-supported sortBy value. */
export function mapUiSortFieldToServer(sortField: ProjectSortField): ProjectServerSortField {
  return sortField;
}

/** Maps UI list controls to GET /projects query parameters (server-side). */
export function resolveListProjectsQuery({
  statusFilter,
  page,
  pageSize,
  search,
  projectManagerUserId,
  clientId,
  departmentId,
  priority,
  sortField = 'updatedAt',
  sortDirection = 'desc',
}: ResolveListProjectsQueryInput): ResolvedListProjectsQuery {
  const skip = Math.max(0, (page - 1) * pageSize);
  const take = Math.min(100, Math.max(1, pageSize));
  const q = search?.trim() ?? '';

  const base: ListProjectsParams = {
    skip,
    take,
    sortBy: mapUiSortFieldToServer(sortField),
    sortOrder: sortDirection,
    ...(q.length > 0 ? { q } : {}),
    ...(projectManagerUserId !== undefined && projectManagerUserId.length > 0
      ? { projectManagerUserId }
      : {}),
    ...(clientId !== undefined && clientId.length > 0 ? { clientId } : {}),
    ...(departmentId !== undefined && departmentId.length > 0 ? { departmentId } : {}),
    ...(priority !== undefined && priority !== 'all' ? { priority } : {}),
  };

  if (statusFilter === 'archived') {
    return {
      params: {
        ...base,
        archivedOnly: true,
        includeArchived: true,
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

/** Returns true when a project record is archived. */
export function isProjectArchived(project: {
  readonly deletedAt?: string | null;
  readonly status?: string;
}): boolean {
  if (project.status === 'ARCHIVED') {
    return true;
  }

  return project.deletedAt !== null && project.deletedAt !== undefined;
}
