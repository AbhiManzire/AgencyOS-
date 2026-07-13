import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ActivityRecord,
  ActivityTypesCatalog,
  CreateActivityPayload,
  ListActivitiesParams,
  ListActivitiesResult,
  ListWorkspaceActivitiesParams,
} from '@/features/activity/api/activity.types';

function toQueryParams(
  params: ListWorkspaceActivitiesParams | ListActivitiesParams,
): Record<string, string | number | undefined> {
  return {
    entityType: params.entityType,
    entityId: params.entityId,
    type: params.type,
    types:
      params.types !== undefined && params.types.length > 0 ? params.types.join(',') : undefined,
    userId: params.userId,
    origin: params.origin,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    skip: params.skip,
    take: params.take,
  };
}

function toListResult(
  data: readonly ActivityRecord[],
  meta: { readonly total?: number; readonly skip?: number; readonly take?: number } | undefined,
  params: ListWorkspaceActivitiesParams | ListActivitiesParams,
): ListActivitiesResult {
  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}

export async function listActivities(
  params: ListWorkspaceActivitiesParams = {},
): Promise<ListActivitiesResult> {
  const response = await apiClient.get<ApiSuccessResponse<ActivityRecord[]>>('/activities', {
    params: toQueryParams(params),
  });

  const { data, meta } = response.data;
  return toListResult(data, meta, params);
}

export async function listActivitiesByEntity(
  params: ListActivitiesParams,
): Promise<ListActivitiesResult> {
  const response = await apiClient.get<ApiSuccessResponse<ActivityRecord[]>>(
    `/activities/${params.entityType}/${params.entityId}`,
    {
      params: toQueryParams(params),
    },
  );

  const { data, meta } = response.data;
  return toListResult(data, meta, params);
}

export async function getActivityTypes(): Promise<ActivityTypesCatalog> {
  const response =
    await apiClient.get<ApiSuccessResponse<ActivityTypesCatalog>>('/activities/types');
  return response.data.data;
}

export async function createActivity(payload: CreateActivityPayload): Promise<ActivityRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ActivityRecord>>('/activities', payload);
  return response.data.data;
}
