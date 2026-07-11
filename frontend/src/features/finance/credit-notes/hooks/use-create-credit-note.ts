import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { createCreditNote } from '@/features/finance/credit-notes/api/credit-notes.api';
import type { CreateCreditNotePayload } from '@/features/finance/credit-notes/api/credit-note.types';
import { creditNotesQueryKeys } from '@/features/finance/credit-notes/hooks/use-credit-notes';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';

/** TanStack Query mutation for POST /credit-notes. */
export function useCreateCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCreditNotePayload) => createCreditNote(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: creditNotesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
