import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContact } from '@/features/clients/contacts/api/contacts.api';
import type { CreateContactPayload } from '@/features/clients/contacts/api/contact.types';
import { invalidateClientContactCaches } from '@/features/clients/contacts/hooks/client-contacts-query-keys';

/** TanStack Query mutation hook for POST /clients/:clientId/contacts. */
export function useCreateClientContact(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateContactPayload) => createContact(clientId, payload),
    onSuccess: async () => {
      await invalidateClientContactCaches(queryClient, clientId);
    },
  });
}
