import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelFollowUp,
  completeFollowUp,
  createFollowUp,
  getFollowUpDashboardSummary,
  listFollowUps,
  updateFollowUp,
} from '@/features/activity/follow-ups/api/follow-ups.api';
import type {
  CreateFollowUpPayload,
  ListFollowUpsParams,
  UpdateFollowUpPayload,
} from '@/features/activity/follow-ups/api/follow-up.types';
import { activitiesQueryKeys } from '@/features/activity/hooks/use-activities';

export const followUpsQueryKeys = {
  all: ['follow-ups'] as const,
  list: (params: ListFollowUpsParams) => [...followUpsQueryKeys.all, 'list', params] as const,
  dashboardSummary: () => [...followUpsQueryKeys.all, 'dashboard-summary'] as const,
};

export function useFollowUps(
  params: ListFollowUpsParams,
  options?: { readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: followUpsQueryKeys.list(params),
    queryFn: async () => {
      const result = await listFollowUps({ take: 50, ...params });
      return result.items;
    },
    enabled:
      (options?.enabled ?? true) &&
      (params.entityType === undefined || params.entityType.length > 0) &&
      (params.entityId === undefined || params.entityId.length > 0),
  });
}

export function useFollowUpDashboardSummary(options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: followUpsQueryKeys.dashboardSummary(),
    queryFn: () => getFollowUpDashboardSummary(),
    enabled: options?.enabled ?? true,
  });
}

async function invalidateFollowUpCaches(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: followUpsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: activitiesQueryKeys.all }),
  ]);
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFollowUpPayload) => createFollowUp(payload),
    onSuccess: async () => {
      await invalidateFollowUpCaches(queryClient);
    },
  });
}

export function useUpdateFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      followUpId,
      payload,
    }: {
      readonly followUpId: string;
      readonly payload: UpdateFollowUpPayload;
    }) => updateFollowUp(followUpId, payload),
    onSuccess: async () => {
      await invalidateFollowUpCaches(queryClient);
    },
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (followUpId: string) => completeFollowUp(followUpId),
    onSuccess: async () => {
      await invalidateFollowUpCaches(queryClient);
    },
  });
}

export function useCancelFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (followUpId: string) => cancelFollowUp(followUpId),
    onSuccess: async () => {
      await invalidateFollowUpCaches(queryClient);
    },
  });
}
