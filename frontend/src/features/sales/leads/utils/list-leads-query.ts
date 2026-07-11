import type { ListLeadsParams } from '@/features/sales/leads/api/lead.types';
import type {
  LeadListStatusFilter,
  LeadSortField,
  SortDirection,
} from '@/features/sales/leads/types';

interface ResolveListLeadsQueryInput {
  readonly statusFilter: LeadListStatusFilter;
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly assignedToUserId?: string;
  readonly source?: string;
  readonly priority?: string;
  readonly sortField?: LeadSortField;
  readonly sortDirection?: SortDirection;
}

interface ResolvedListLeadsQuery {
  readonly params: ListLeadsParams;
}

/** Maps UI list controls to GET /leads query parameters (server-side). */
export function resolveListLeadsQuery({
  statusFilter,
  page,
  pageSize,
  search,
  assignedToUserId,
  source,
  priority,
  sortField = 'updatedAt',
  sortDirection = 'desc',
}: ResolveListLeadsQueryInput): ResolvedListLeadsQuery {
  const skip = Math.max(0, (page - 1) * pageSize);
  const take = Math.min(100, Math.max(1, pageSize));
  const q = search?.trim() ?? '';

  const base: ListLeadsParams = {
    skip,
    take,
    sortBy: sortField,
    sortOrder: sortDirection,
    ...(q.length > 0 ? { q } : {}),
    ...(assignedToUserId !== undefined && assignedToUserId.length > 0 ? { assignedToUserId } : {}),
    ...(source !== undefined && source !== 'all' && source.length > 0
      ? { source: source as ListLeadsParams['source'] }
      : {}),
    ...(priority !== undefined && priority !== 'all' && priority.length > 0
      ? { priority: priority as ListLeadsParams['priority'] }
      : {}),
  };

  if (statusFilter === 'archived') {
    return {
      params: {
        ...base,
        archivedOnly: true,
        includeArchived: true,
      },
    };
  }

  return {
    params: {
      ...base,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    },
  };
}

/** Returns true when a lead is archived. */
export function isLeadArchived(lead: {
  readonly deletedAt?: string | null;
  readonly status?: string;
  readonly isArchived?: boolean;
}): boolean {
  if (lead.isArchived !== undefined) {
    return lead.isArchived;
  }

  if (lead.status === 'ARCHIVED') {
    return true;
  }

  return lead.deletedAt !== null && lead.deletedAt !== undefined;
}
