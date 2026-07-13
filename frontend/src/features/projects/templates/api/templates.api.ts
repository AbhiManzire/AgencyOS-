import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateProjectTemplatePayload,
  ListProjectTemplatesParams,
  ListProjectTemplatesResult,
  ProjectTemplateRecord,
  UpdateProjectTemplatePayload,
} from '@/features/projects/templates/api/template.types';

/** Lists project templates for the active workspace. */
export async function listProjectTemplates(
  params: ListProjectTemplatesParams = {},
): Promise<ListProjectTemplatesResult> {
  const response = await apiClient.get<ApiSuccessResponse<ProjectTemplateRecord[]>>(
    '/project-templates',
    { params },
  );

  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 50,
  };
}

/** Fetches a single project template. */
export async function getProjectTemplate(id: string): Promise<ProjectTemplateRecord> {
  const response = await apiClient.get<ApiSuccessResponse<ProjectTemplateRecord>>(
    `/project-templates/${id}`,
  );
  return response.data.data;
}

/** Creates a project template. */
export async function createProjectTemplate(
  payload: CreateProjectTemplatePayload,
): Promise<ProjectTemplateRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ProjectTemplateRecord>>(
    '/project-templates',
    payload,
  );
  return response.data.data;
}

/** Updates a project template. */
export async function updateProjectTemplate(
  id: string,
  payload: UpdateProjectTemplatePayload,
): Promise<ProjectTemplateRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<ProjectTemplateRecord>>(
    `/project-templates/${id}`,
    payload,
  );
  return response.data.data;
}

/** Soft-deletes a project template. */
export async function deleteProjectTemplate(id: string): Promise<void> {
  await apiClient.delete(`/project-templates/${id}`);
}
