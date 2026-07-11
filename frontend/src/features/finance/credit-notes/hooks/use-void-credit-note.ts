import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import { voidCreditNote } from '@/features/finance/credit-notes/api/credit-notes.api';
import { creditNotesQueryKeys } from '@/features/finance/credit-notes/hooks/use-credit-notes';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';

/** TanStack Query mutation for POST /credit-notes/:id/void. */
export function useVoidCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => voidCreditNote(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: creditNotesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
