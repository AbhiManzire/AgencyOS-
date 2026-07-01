import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDeal } from '@/features/sales/api/deals.api';
import type { UpdateDealPayload } from '@/features/sales/api/deal.types';
import { dealsQueryKeys } from '@/features/sales/hooks/use-deals';

interface UpdateDealVariables {
  readonly id: string;
  readonly payload: UpdateDealPayload;
}

/** TanStack Query mutation hook for PATCH /deals/:id. */
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateDealVariables) => updateDeal(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.detail(variables.id) }),
      ]);
    },
  });
}
