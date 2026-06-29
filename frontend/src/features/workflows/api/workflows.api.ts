import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateWorkflowPayload,
  ListWorkflowsParams,
  ListWorkflowsResult,
  WorkflowRecord,
} from '@/features/workflows/api/workflow.types';

export async function listWorkflows(
  params: ListWorkflowsParams = {},
): Promise<ListWorkflowsResult> {
  const response = await apiClient.get<ApiSuccessResponse<WorkflowRecord[]>>('/workflows', {
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

export async function createWorkflow(payload: CreateWorkflowPayload): Promise<WorkflowRecord> {
  const response = await apiClient.post<ApiSuccessResponse<WorkflowRecord>>('/workflows', payload);
  return response.data.data;
}
