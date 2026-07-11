import type { ListClientsParams } from '@/features/clients/api/client.types';
import type {
  ClientListStatusFilter,
  ClientServerSortField,
  ClientSortField,
  SortDirection,
} from '@/features/clients/types';

interface ResolveListClientsQueryInput {
  readonly statusFilter: ClientListStatusFilter;
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly ownerUserId?: string;
  readonly sortField?: ClientSortField;
  readonly sortDirection?: SortDirection;
}

interface ResolvedListClientsQuery {
  readonly params: ListClientsParams;
  readonly usesClientSideListProcessing: false;
}

/** Maps UI sort field to a server-supported sortBy value. */
export function mapUiSortFieldToServer(sortField: ClientSortField): ClientServerSortField {
  switch (sortField) {
    case 'company':
      return 'legalName';
    case 'owner':
      return 'displayName';
    case 'displayName':
    case 'status':
    case 'email':
    case 'createdAt':
      return sortField;
  }
}

/** Maps UI list controls to GET /clients query parameters (server-side). */
export function resolveListClientsQuery({
  statusFilter,
  page,
  pageSize,
  search,
  ownerUserId,
  sortField = 'displayName',
  sortDirection = 'asc',
}: ResolveListClientsQueryInput): ResolvedListClientsQuery {
  const skip = Math.max(0, (page - 1) * pageSize);
  const take = Math.min(100, Math.max(1, pageSize));
  const q = search?.trim() ?? '';

  const base: ListClientsParams = {
    skip,
    take,
    sortBy: mapUiSortFieldToServer(sortField),
    sortOrder: sortDirection,
    ...(q.length > 0 ? { q } : {}),
    ...(ownerUserId !== undefined && ownerUserId.length > 0 ? { ownerUserId } : {}),
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

/** Returns true when a client record or list item is archived. */
export function isClientArchived(client: {
  readonly deletedAt?: string | null;
  readonly isArchived?: boolean;
}): boolean {
  if (client.isArchived !== undefined) {
    return client.isArchived;
  }

  return client.deletedAt !== null && client.deletedAt !== undefined;
}
