import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ActivityRecord,
  ListActivitiesParams,
  ListActivitiesResult,
  ListWorkspaceActivitiesParams,
} from '@/features/activity/api/activity.types';

export async function listActivities(
  params: ListWorkspaceActivitiesParams = {},
): Promise<ListActivitiesResult> {
  const response = await apiClient.get<ApiSuccessResponse<ActivityRecord[]>>('/activities', {
    params: {
      skip: params.skip,
      take: params.take,
    },
  });

  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}

export async function listActivitiesByEntity(
  params: ListActivitiesParams,
): Promise<ListActivitiesResult> {
  const response = await apiClient.get<ApiSuccessResponse<ActivityRecord[]>>(
    `/activities/${params.entityType}/${params.entityId}`,
    {
      params: {
        skip: params.skip,
        take: params.take,
      },
    },
  );

  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}
