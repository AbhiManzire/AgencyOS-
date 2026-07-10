import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateProjectPayload,
  ListProjectsParams,
  ListProjectsResult,
  ProjectRecord,
  UpdateProjectPayload,
} from '@/features/projects/api/project.types';

/** Fetches a paginated list of projects for the active workspace. */
export async function listProjects(params: ListProjectsParams): Promise<ListProjectsResult> {
  const response = await apiClient.get<ApiSuccessResponse<ProjectRecord[]>>('/projects', {
    params,
  });

  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}

/** Creates a new project in the active workspace. */
export async function createProject(payload: CreateProjectPayload): Promise<ProjectRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ProjectRecord>>('/projects', payload);
  return response.data.data;
}

/** Updates an existing project in the active workspace. */
export async function updateProject(
  id: string,
  payload: UpdateProjectPayload,
): Promise<ProjectRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<ProjectRecord>>(
    `/projects/${id}`,
    payload,
  );
  return response.data.data;
}

/** Fetches a single project by id for the active workspace. */
export async function getProject(id: string): Promise<ProjectRecord> {
  const response = await apiClient.get<ApiSuccessResponse<ProjectRecord>>(`/projects/${id}`);
  return response.data.data;
}

/** Marks a project as completed. */
export async function completeProject(id: string): Promise<ProjectRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ProjectRecord>>(
    `/projects/${id}/complete`,
  );
  return response.data.data;
}

/** Marks a completed project as invoice ready. */
export async function markProjectInvoiceReady(id: string): Promise<ProjectRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ProjectRecord>>(
    `/projects/${id}/invoice-ready`,
  );
  return response.data.data;
}

/** Soft-archives a project. */
export async function archiveProject(id: string): Promise<ProjectRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ProjectRecord>>(
    `/projects/${id}/archive`,
  );
  return response.data.data;
}

/** Restores an archived project. */
export async function restoreProject(id: string): Promise<ProjectRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ProjectRecord>>(
    `/projects/${id}/restore`,
  );
  return response.data.data;
}
