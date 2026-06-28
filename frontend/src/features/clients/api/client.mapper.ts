import type { ClientRecord } from '@/features/clients/api/client.types';
import type { ClientListItem } from '@/features/clients/types';

/** Maps an API client record to the Client List row shape. */
export function mapClientRecordToListItem(record: ClientRecord): ClientListItem {
  return {
    id: record.id,
    displayName: record.displayName,
    company: record.legalName ?? record.displayName,
    status: record.status,
    owner: record.ownerUserId ?? '—',
    email: record.email ?? '—',
    phone: record.phone ?? '—',
    createdAt: record.createdAt,
  };
}
