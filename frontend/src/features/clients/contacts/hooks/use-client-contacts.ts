import { useQuery } from '@tanstack/react-query';
import { listContacts } from '@/features/clients/contacts/api/contacts.api';
import { contactRecordToListItem } from '@/features/clients/contacts/api/contact.mapper';
import { clientContactsQueryKeys } from '@/features/clients/contacts/hooks/client-contacts-query-keys';

/** TanStack Query hook for GET /clients/:clientId/contacts. */
export function useClientContacts(clientId: string) {
  return useQuery({
    queryKey: clientContactsQueryKeys.list(clientId),
    queryFn: async () => {
      const records = await listContacts(clientId);
      return records.map(contactRecordToListItem);
    },
    enabled: clientId.length > 0,
  });
}
