import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type { ProjectRecord } from '@/features/projects/api/project.types';
import type {
  CreateProjectFromClientPayload,
  CreateProjectFromDealPayload,
  ProjectDeliveryDashboard,
  ProjectHealthResult,
  ProjectHoursSummary,
  ProjectPortalResult,
  ProjectWorkspaceResult,
} from '@/features/projects/delivery/api/delivery.types';

/** Creates a project from a won deal. */
export async function createProjectFromDeal(
  payload: CreateProjectFromDealPayload,
): Promise<ProjectRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ProjectRecord>>(
    '/projects/from-deal',
    payload,
  );
  return response.data.data;
}

/** Creates a project from a client account. */
export async function createProjectFromClient(
  payload: CreateProjectFromClientPayload,
): Promise<ProjectRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ProjectRecord>>(
    '/projects/from-client',
    payload,
  );
  return response.data.data;
}

/** Fetches the delivery operations dashboard. */
export async function getProjectDeliveryDashboard(): Promise<ProjectDeliveryDashboard> {
  const response = await apiClient.get<ApiSuccessResponse<ProjectDeliveryDashboard>>(
    '/projects/delivery/dashboard',
  );
  return response.data.data;
}

/** Fetches computed health for a project. */
export async function getProjectHealth(projectId: string): Promise<ProjectHealthResult> {
  const response = await apiClient.get<ApiSuccessResponse<ProjectHealthResult>>(
    `/projects/${projectId}/health`,
  );
  return response.data.data;
}

/** Recalculates and returns project health. */
export async function refreshProjectHealth(projectId: string): Promise<ProjectHealthResult> {
  const response = await apiClient.post<ApiSuccessResponse<ProjectHealthResult>>(
    `/projects/${projectId}/health/refresh`,
  );
  return response.data.data;
}

/** Fetches the delivery workspace summary for a project. */
export async function getProjectWorkspace(projectId: string): Promise<ProjectWorkspaceResult> {
  const response = await apiClient.get<ApiSuccessResponse<ProjectWorkspaceResult>>(
    `/projects/${projectId}/workspace`,
  );
  return response.data.data;
}

/** Fetches the client-facing portal snapshot for a project. */
export async function getProjectPortal(projectId: string): Promise<ProjectPortalResult> {
  const response = await apiClient.get<ApiSuccessResponse<ProjectPortalResult>>(
    `/projects/${projectId}/portal`,
  );
  return response.data.data;
}

/** Fetches hours utilization summary for a project. */
export async function getProjectHoursSummary(projectId: string): Promise<ProjectHoursSummary> {
  const response = await apiClient.get<ApiSuccessResponse<ProjectHoursSummary>>(
    `/projects/${projectId}/hours-summary`,
  );
  return response.data.data;
}
