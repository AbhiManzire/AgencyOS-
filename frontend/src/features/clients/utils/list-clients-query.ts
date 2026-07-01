import type { ListClientsParams } from '@/features/clients/api/client.types';
import type { ClientListStatusFilter } from '@/features/clients/types';

/** Backend max page size — list UI filters, sorts, and paginates within this window. */
const LIST_FETCH_TAKE = 100;

interface ResolvedListClientsQuery {
  readonly params: ListClientsParams;
  readonly usesClientSideListProcessing: boolean;
}

/** Maps UI status filter values to GET /clients query parameters. */
export function resolveListClientsQuery(
  statusFilter: ClientListStatusFilter,
  _page: number,
  _pageSize: number,
): ResolvedListClientsQuery {
  if (statusFilter === 'archived') {
    return {
      params: {
        skip: 0,
        take: LIST_FETCH_TAKE,
        includeArchived: true,
      },
      usesClientSideListProcessing: true,
    };
  }

  return {
    params: {
      skip: 0,
      take: LIST_FETCH_TAKE,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    },
    usesClientSideListProcessing: true,
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
