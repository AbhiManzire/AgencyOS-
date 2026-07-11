import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { applyCreditNote } from '@/features/finance/credit-notes/api/credit-notes.api';
import type { ApplyCreditNotePayload } from '@/features/finance/credit-notes/api/credit-note.types';
import { creditNotesQueryKeys } from '@/features/finance/credit-notes/hooks/use-credit-notes';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';
import { paymentsQueryKeys } from '@/features/finance/payments/hooks/payments-query-keys';

interface ApplyCreditNoteVariables {
  readonly id: string;
  readonly payload: ApplyCreditNotePayload;
}

/** TanStack Query mutation for POST /credit-notes/:id/apply. */
export function useApplyCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: ApplyCreditNoteVariables) => applyCreditNote(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: creditNotesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
