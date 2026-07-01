import { useQuery } from '@tanstack/react-query';
import { activityRecordToTimelineEntry } from '@/features/activity/api/activity.mapper';
import { listActivities, listActivitiesByEntity } from '@/features/activity/api/activities.api';

export const activitiesQueryKeys = {
  all: ['activities'] as const,
  list: (take: number) => [...activitiesQueryKeys.all, 'list', take] as const,
  entity: (entityType: string, entityId: string) =>
    [...activitiesQueryKeys.all, entityType, entityId] as const,
};

export function useActivities(
  entityType: string,
  entityId: string,
  options?: { readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: activitiesQueryKeys.entity(entityType, entityId),
    queryFn: async () => {
      const result = await listActivitiesByEntity({ entityType, entityId, take: 50 });
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
