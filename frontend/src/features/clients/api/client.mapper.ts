import type { ClientRecord } from '@/features/clients/api/client.types';
import type { ClientListItem, WorkspaceOwnerOption } from '@/features/clients/types';

/** Maps an API client record to the Client List row shape. */
export function mapClientRecordToListItem(
  record: ClientRecord,
  ownersById?: ReadonlyMap<string, WorkspaceOwnerOption>,
): ClientListItem {
  const ownerOption = record.ownerUserId !== null ? ownersById?.get(record.ownerUserId) : undefined;

  return {
    id: record.id,
    displayName: record.displayName,
    clientCode: record.clientCode ?? '—',
    company: record.legalName ?? record.displayName,
    status: record.status,
    owner: ownerOption?.displayName ?? record.ownerUserId ?? '—',
    email: record.email ?? '—',
    phone: record.phone ?? '—',
    createdAt: record.createdAt,
    isArchived: record.deletedAt !== null,
  };
}
