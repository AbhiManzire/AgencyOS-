import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import {
  archiveDeal,
  convertDealToInvoice,
  convertDealToProject,
  restoreDeal,
} from '@/features/sales/api/deals.api';
import type { ConvertDealToInvoicePayload } from '@/features/sales/api/deal.types';
import { dealsQueryKeys } from '@/features/sales/hooks/use-deals';

/** Archives a deal. */
export function useArchiveDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveDeal(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.detail(id) }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}

/** Restores an archived deal. */
export function useRestoreDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreDeal(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.detail(id) }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}

/** Converts a deal to a project. */
export function useConvertDealToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => convertDealToProject(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.detail(id) }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}

/** Converts a won deal to an invoice. */
export function useConvertDealToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: ConvertDealToInvoicePayload }) =>
      convertDealToInvoice(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.detail(variables.id) }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
