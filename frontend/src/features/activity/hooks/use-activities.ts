import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createActivity,
  getActivityTypes,
  listActivities,
  listActivitiesByEntity,
} from '@/features/activity/api/activities.api';
import { activityRecordToTimelineEntry } from '@/features/activity/api/activity.mapper';
import type { CreateActivityPayload } from '@/features/activity/api/activity.types';
import type { ActivityTimelineFilters } from '@/features/activity/types';

export const activitiesQueryKeys = {
  all: ['activities'] as const,
  list: (take: number) => [...activitiesQueryKeys.all, 'list', take] as const,
  types: () => [...activitiesQueryKeys.all, 'types'] as const,
  entity: (entityType: string, entityId: string, filters?: ActivityTimelineFilters) =>
    [...activitiesQueryKeys.all, entityType, entityId, filters ?? {}] as const,
};

export function useActivities(
  entityType: string,
  entityId: string,
  options?: {
    readonly enabled?: boolean;
    readonly filters?: ActivityTimelineFilters;
  },
) {
  const filters = options?.filters;

  return useQuery({
    queryKey: activitiesQueryKeys.entity(entityType, entityId, filters),
    queryFn: async () => {
      const result = await listActivitiesByEntity({
        entityType,
        entityId,
        take: filters?.take ?? 50,
        ...filters,
      });
      return result.items.map(activityRecordToTimelineEntry);
    },
    enabled: (options?.enabled ?? true) && entityType.length > 0 && entityId.length > 0,
  });
}

export function useRecentActivities(take = 10) {
  return useQuery({
    queryKey: activitiesQueryKeys.list(take),
    queryFn: async () => {
      const result = await listActivities({ take });
      return result.items.map(activityRecordToTimelineEntry);
    },
  });
}

export function useActivityTypes(options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: activitiesQueryKeys.types(),
    queryFn: () => getActivityTypes(),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateActivityPayload) => createActivity(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: activitiesQueryKeys.all });
    },
  });
}
