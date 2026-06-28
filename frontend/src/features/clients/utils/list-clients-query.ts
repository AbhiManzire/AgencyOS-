import type { ListClientsParams } from '@/features/clients/api/client.types';
import type { ClientListStatusFilter } from '@/features/clients/types';

const ARCHIVED_LIST_TAKE = 100;

interface ResolvedListClientsQuery {
  readonly params: ListClientsParams;
  readonly usesArchivedClientSideFilter: boolean;
}

/** Maps UI status filter values to GET /clients query parameters. */
export function resolveListClientsQuery(
  statusFilter: ClientListStatusFilter,
  page: number,
  pageSize: number,
): ResolvedListClientsQuery {
  if (statusFilter === 'archived') {
    return {
      params: {
        skip: 0,
        take: ARCHIVED_LIST_TAKE,
        includeArchived: true,
      },
      usesArchivedClientSideFilter: true,
    };
  }

  return {
    params: {
      skip: (page - 1) * pageSize,
      take: pageSize,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    },
    usesArchivedClientSideFilter: false,
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
