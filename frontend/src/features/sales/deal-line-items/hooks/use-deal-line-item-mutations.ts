import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createDealLineItem,
  deleteDealLineItem,
  updateDealLineItem,
} from '@/features/sales/deal-line-items/api/deal-line-items.api';
import type {
  CreateDealLineItemPayload,
  UpdateDealLineItemPayload,
} from '@/features/sales/deal-line-items/api/deal-line-item.types';
import { dealLineItemsQueryKeys } from '@/features/sales/deal-line-items/hooks/deal-line-items-query-keys';
import { dealsQueryKeys } from '@/features/sales/hooks/use-deals';

export function useCreateDealLineItem(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDealLineItemPayload) => createDealLineItem(dealId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dealLineItemsQueryKeys.list(dealId) }),
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.detail(dealId) }),
      ]);
    },
  });
}

export function useUpdateDealLineItem(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lineItemId,
      payload,
    }: {
      lineItemId: string;
      payload: UpdateDealLineItemPayload;
    }) => updateDealLineItem(lineItemId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dealLineItemsQueryKeys.list(dealId) }),
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.detail(dealId) }),
      ]);
    },
  });
}

export function useDeleteDealLineItem(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lineItemId: string) => deleteDealLineItem(lineItemId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dealLineItemsQueryKeys.list(dealId) }),
        queryClient.invalidateQueries({ queryKey: dealsQueryKeys.detail(dealId) }),
      ]);
    },
  });
}
