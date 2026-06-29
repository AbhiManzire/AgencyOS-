import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDeal } from '@/features/sales/api/deals.api';
import type { ListDealsParams, ListDealsResult } from '@/features/sales/api/deal.types';
import { dealsQueryKeys } from '@/features/sales/hooks/use-deals';
import type { DealStage } from '@/features/sales/types';

interface UpdateDealStageVariables {
  readonly dealId: string;
  readonly stage: DealStage;
}

interface UpdateDealStageContext {
  readonly previous: ListDealsResult | undefined;
}

/** Updates deal stage with optimistic cache updates and rollback on failure. */
export function useUpdateDealStageOptimistic(listParams: ListDealsParams) {
  const queryClient = useQueryClient();
  const queryKey = dealsQueryKeys.list(listParams);

  return useMutation({
    mutationFn: ({ dealId, stage }: UpdateDealStageVariables) => updateDeal(dealId, { stage }),
    onMutate: async ({ dealId, stage }) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<ListDealsResult>(queryKey);

      if (previous !== undefined) {
        queryClient.setQueryData<ListDealsResult>(queryKey, {
          ...previous,
          items: previous.items.map((deal) => (deal.id === dealId ? { ...deal, stage } : deal)),
        });
      }

      return { previous } satisfies UpdateDealStageContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: dealsQueryKeys.all });
    },
  });
}
