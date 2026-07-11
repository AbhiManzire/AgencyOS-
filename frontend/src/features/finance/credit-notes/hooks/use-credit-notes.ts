import { useQuery } from '@tanstack/react-query';
import { listClients } from '@/features/clients/api/clients.api';
import { listCreditNotes } from '@/features/finance/credit-notes/api/credit-notes.api';
import type { ListCreditNotesParams } from '@/features/finance/credit-notes/api/credit-note.types';
import { creditNoteRecordToListItem } from '@/features/finance/credit-notes/forms/credit-note-form.validation';

export const creditNotesQueryKeys = {
  all: ['creditNotes'] as const,
  list: (params: ListCreditNotesParams) => [...creditNotesQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...creditNotesQueryKeys.all, 'detail', id] as const,
};

/** TanStack Query hook for GET /credit-notes with client names resolved. */
export function useCreditNotes(
  params: ListCreditNotesParams = {},
  options?: { readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: creditNotesQueryKeys.list(params),
    queryFn: async () => {
      const [notesResult, clientsResult] = await Promise.all([
        listCreditNotes(params),
        listClients({ take: 100 }),
      ]);

      const clientNameById = new Map(
        clientsResult.items.map((client) => [client.id, client.displayName] as const),
      );

      return {
        ...notesResult,
        items: notesResult.items.map((note) =>
          creditNoteRecordToListItem(note, clientNameById.get(note.clientId) ?? ''),
        ),
      };
    },
    enabled: options?.enabled ?? true,
  });
}
