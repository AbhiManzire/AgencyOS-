import { useQuery } from '@tanstack/react-query';
import { getCreditNote } from '@/features/finance/credit-notes/api/credit-notes.api';
import { creditNotesQueryKeys } from '@/features/finance/credit-notes/hooks/use-credit-notes';

/** TanStack Query hook for GET /credit-notes/:id. */
export function useCreditNote(id: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: creditNotesQueryKeys.detail(id),
    queryFn: () => getCreditNote(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
