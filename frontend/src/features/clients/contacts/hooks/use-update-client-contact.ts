import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateContact } from '@/features/clients/contacts/api/contacts.api';
import type { UpdateContactPayload } from '@/features/clients/contacts/api/contact.types';
import { invalidateClientContactCaches } from '@/features/clients/contacts/hooks/client-contacts-query-keys';

interface UpdateClientContactVariables {
  readonly contactId: string;
  readonly payload: UpdateContactPayload;
}

/** TanStack Query mutation hook for PATCH /clients/:clientId/contacts/:contactId. */
export function useUpdateClientContact(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, payload }: UpdateClientContactVariables) =>
      updateContact(clientId, contactId, payload),
    onSuccess: async () => {
      await invalidateClientContactCaches(queryClient, clientId);
    },
  });
}
