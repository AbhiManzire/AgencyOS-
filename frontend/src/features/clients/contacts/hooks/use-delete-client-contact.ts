import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteContact } from '@/features/clients/contacts/api/contacts.api';
import { invalidateClientContactCaches } from '@/features/clients/contacts/hooks/client-contacts-query-keys';

/** TanStack Query mutation hook for DELETE /clients/:clientId/contacts/:contactId. */
export function useDeleteClientContact(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) => deleteContact(clientId, contactId),
    onSuccess: async () => {
      await invalidateClientContactCaches(queryClient, clientId);
    },
  });
}
